import logging
import json
import os
from django.utils import timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django_apscheduler.jobstores import DjangoJobStore

logger = logging.getLogger(__name__)


def get_fcm_access_token():
    """Get a short-lived OAuth2 access token using the service account."""
    import google.auth.transport.requests
    import google.oauth2.service_account

    # Try environment variable first (for Railway)
    service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if service_account_json:
        try:
            info = json.loads(service_account_json)
            credentials = google.oauth2.service_account.Credentials.from_service_account_info(
                info,
                scopes=['https://www.googleapis.com/auth/firebase.messaging'],
            )
            request = google.auth.transport.requests.Request()
            credentials.refresh(request)
            return credentials.token
        except Exception as e:
            logger.error(f'Failed to load service account from env: {e}')
            return None

    # Fall back to local file (for development)
    service_account_path = os.environ.get(
        'FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json'
    )
    if not os.path.exists(service_account_path):
        logger.warning(f'Service account file not found: {service_account_path}')
        return None

    try:
        credentials = google.oauth2.service_account.Credentials.from_service_account_file(
            service_account_path,
            scopes=['https://www.googleapis.com/auth/firebase.messaging'],
        )
        request = google.auth.transport.requests.Request()
        credentials.refresh(request)
        return credentials.token
    except Exception as e:
        logger.error(f'Failed to load service account from file: {e}')
        return None


def send_fcm_notification(token, title, body):
    """Send a push notification via FCM HTTP V1 API using service account."""
    import requests

    access_token = get_fcm_access_token()
    if not access_token:
        logger.warning('Could not get FCM access token, skipping notification')
        return False

    # Get project ID from environment or service account file
    project_id = os.environ.get('FIREBASE_PROJECT_ID')
    if not project_id:
        service_account_path = os.environ.get(
            'FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json'
        )
        # Try env variable JSON first
        service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
        if service_account_json:
            try:
                project_id = json.loads(service_account_json).get('project_id')
            except Exception:
                pass
        # Fall back to file
        if not project_id:
            try:
                with open(service_account_path) as f:
                    project_id = json.load(f).get('project_id')
            except Exception:
                logger.error('Could not determine Firebase project ID')
                return False

    url = f'https://fcm.googleapis.com/v1/projects/{project_id}/messages:send'

    payload = {
    'message': {
        'token': token,
        'data': {
            'title': title,
            'body': body,
        },
        'webpush': {
            'headers': {
                'Urgency': 'high'
            }
            # no 'notification' key here
        }
    }
}

    res = requests.post(
        url,
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        },
        data=json.dumps(payload),
        timeout=10,
    )

    if res.status_code != 200:
        logger.error(f'FCM V1 error: {res.status_code} {res.text}')
        return False

    return True


def check_and_send_reminders():
    """
    Runs every minute.
    Checks all active reminders and sends notifications when the time matches.
    """
    from api.models import Reminder, DeviceToken

    now = timezone.localtime(timezone.now())
    current_time_str = now.strftime('%H:%M')
    current_hour = now.hour
    current_minute = now.minute

    logger.info(f'Checking reminders at {current_time_str}')

    active_reminders = Reminder.objects.filter(
        is_active=True
    ).select_related('user', 'medicine_instance__medicine')

    for reminder in active_reminders:
        should_notify = False

        if reminder.schedule_type == 'fixed_times':
            times = reminder.times
            if isinstance(times, list):
                should_notify = current_time_str in times

        elif reminder.schedule_type == 'interval':
            times = reminder.times
            if isinstance(times, dict):
                every_hours = times.get('every_hours', 0)
                start_time = times.get('start_time', '00:00')
                if every_hours > 0:
                    try:
                        start_h, start_m = map(int, start_time.split(':'))
                    except (ValueError, AttributeError):
                        start_h, start_m = 0, 0

                    # Calculate minutes since start of day for start time and now
                    start_total_minutes = start_h * 60 + start_m
                    now_total_minutes = current_hour * 60 + current_minute
                    interval_minutes = every_hours * 60

                    # Check if (now - start) is divisible by interval
                    diff = (now_total_minutes - start_total_minutes) % (24 * 60)
                    should_notify = (diff % interval_minutes == 0)

        if not should_notify:
            continue

        # Get all device tokens for this user
        tokens = DeviceToken.objects.filter(user=reminder.user)
        if not tokens.exists():
            logger.info(f'No device tokens for user {reminder.user.email}')
            continue

        medicine_name = reminder.medicine_instance.medicine.name_ar
        title = f'💊 تذكير دواء — {medicine_name}'
        body = f'حان وقت جرعتك: {reminder.dosage}'

        for device in tokens:
            success = send_fcm_notification(device.token, title, body)
            if success:
                logger.info(f'Notification sent to {reminder.user.email} for {medicine_name}')
            else:
                logger.warning(f'Failed to send to {reminder.user.email} token {device.token[:20]}...')


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), 'default')

    scheduler.add_job(
        check_and_send_reminders,
        trigger=IntervalTrigger(minutes=1),
        id='check_reminders',
        name='Check and send reminders every minute',
        replace_existing=True,
    )

    scheduler.start()
    logger.info('Reminder scheduler started')
    return scheduler