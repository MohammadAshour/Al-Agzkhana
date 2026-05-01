import os
import sys
import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)


class ApiConfig(AppConfig):
    name = "api"

    def ready(self):
        is_runserver = 'runserver' in sys.argv
        is_gunicorn = os.environ.get('SERVER_SOFTWARE', '').startswith('gunicorn')
        is_main_reload_process = os.environ.get('RUN_MAIN') == 'true'
        if is_gunicorn or (is_runserver and is_main_reload_process):
            try:
                from .scheduler import start_scheduler
                start_scheduler()
                logger.info("Scheduler started successfully.")
            except Exception as e:
                logger.error(f"Failed to start scheduler: {e}")