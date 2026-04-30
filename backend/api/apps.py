from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class ApiConfig(AppConfig):
    name = "api"

    def ready(self):
        # Only start scheduler in the main process, not in migrations or management commands
        import sys
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv[0:1]:
            try:
                from .scheduler import start_scheduler
                start_scheduler()
            except Exception as e:
                logger.error(f'Failed to start scheduler: {e}')