#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations

from eric.core.models import disable_permission_checks

REMINDER_KEYS = (
    'NOTIFICATION_CONF_PROJECT_COMMENT',
)


def opt_users_in_for_project_comment_notifications(apps, schema_editor):
    NotificationConfiguration = apps.get_model("notifications", "NotificationConfiguration")

    with disable_permission_checks(NotificationConfiguration):
        for config in NotificationConfiguration.objects.all():
            for reminder_key in REMINDER_KEYS:
                if reminder_key not in config.allowed_notifications:
                    config.allowed_notifications.append(reminder_key)
                    config.save()


def opt_users_out_of_project_comment_notifications(apps, schema_editor):
    NotificationConfiguration = apps.get_model("notifications", "NotificationConfiguration")

    with disable_permission_checks(NotificationConfiguration):
        for config in NotificationConfiguration.objects.all():
            for reminder_key in REMINDER_KEYS:
                if reminder_key in config.allowed_notifications:
                    config.allowed_notifications.remove(reminder_key)
                    config.save()


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('notifications', '0011_add_project_comment_notification'),
    ]

    operations = [
        migrations.RunPython(
            opt_users_in_for_project_comment_notifications,
            opt_users_out_of_project_comment_notifications
        ),
    ]
