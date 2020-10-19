#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations

from eric.core.models import disable_permission_checks

REMINDER_KEY = 'NOTIFICATION_CONF_MEETING_REMINDER'


def opt_users_in_for_meeting_reminders(apps, schema_editor):
    NotificationConfiguration = apps.get_model("notifications", "NotificationConfiguration")

    with disable_permission_checks(NotificationConfiguration):
        for config in NotificationConfiguration.objects.all():
            if REMINDER_KEY not in config.allowed_notifications:
                config.allowed_notifications.append(REMINDER_KEY)
                config.save()


def opt_users_out_of_meeting_reminders(apps, schema_editor):
    NotificationConfiguration = apps.get_model("notifications", "NotificationConfiguration")

    with disable_permission_checks(NotificationConfiguration):
        for config in NotificationConfiguration.objects.all():
            if REMINDER_KEY in config.allowed_notifications:
                config.allowed_notifications.remove(REMINDER_KEY)
                config.save()


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('notifications', '0004_scheduled_notification'),
    ]

    operations = [
        migrations.RunPython(
            opt_users_in_for_meeting_reminders,
            opt_users_out_of_meeting_reminders
        ),
    ]
