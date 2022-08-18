#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf import settings

from celery import Celery

app = Celery('eric')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks(settings.INSTALLED_APPS)

# Celery beat schedule
app.conf.beat_schedule = {
    'import-dss-files': {
        'task': 'eric.dss.tasks.import_dss_files',
        'schedule': 60 * 3,  # 3 minutes
    },
    'scan-filesystem': {
        'task': 'eric.dss.tasks.scan_filesystem',
        'schedule': 60 * 7,  # 7 minutes
    },
    'send-dss-notifications-for-import-in-progress': {
        'task': 'eric.dss.tasks.send_dss_notifications_for_import_in_progress',
        'schedule': 60 * 25,  # 25 minutes
    },
    'send-dss-notifications-for-import-finished': {
        'task': 'eric.dss.tasks.send_dss_notifications_for_import_finished',
        'schedule': 60 * 30,  # 30 minutes
    },
    'send-dss-notifications-for-failed-imports': {
        'task': 'eric.dss.tasks.send_dss_notifications_for_failed_imports',
        'schedule': 60 * 35,  # 35 minutes
    },
    'globus_message_queue_consumer': {
        'task': 'eric.dss.tasks.globus_message_queue_consumer',
        'schedule': 60 * 7,  # 7 minutes
    },
    'requeue_hanging_files_to_import': {
        'task': 'eric.dss.tasks.requeue_hanging_files_to_import',
        'schedule': 60 * 60 * 3,  # 3 hours
    },
    'process_dir_metadata_etags': {
        'task': 'eric.dss.tasks.process_dir_metadata_etags',
        'schedule': 60 * 60 * 24,  # 24 hours
    },
}
