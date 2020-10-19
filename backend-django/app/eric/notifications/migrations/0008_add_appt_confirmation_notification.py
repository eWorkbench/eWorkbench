#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.contrib.postgres.fields
from django.db import migrations
from django.db import models

from eric.core.models import disable_permission_checks

NOTIFICATION_KEY = 'MAIL_CONF_MEETING_CONFIRMATION'


def opt_in(apps, schema_editor):
    NotificationConfiguration = apps.get_model("notifications", "NotificationConfiguration")

    with disable_permission_checks(NotificationConfiguration):
        for config in NotificationConfiguration.objects.all():
            if NOTIFICATION_KEY not in config.allowed_notifications:
                config.allowed_notifications.append(NOTIFICATION_KEY)
                config.save()


def opt_out(apps, schema_editor):
    NotificationConfiguration = apps.get_model("notifications", "NotificationConfiguration")

    with disable_permission_checks(NotificationConfiguration):
        for config in NotificationConfiguration.objects.all():
            if NOTIFICATION_KEY in config.allowed_notifications:
                config.allowed_notifications.remove(NOTIFICATION_KEY)
                config.save()


class Migration(migrations.Migration):
    dependencies = [
        ('notifications', '0007_no_schedulednotification_time_defaults'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(
                choices=[('NOTIFICATION_CONF_MEETING_USER_CHANGED', 'Attended users of meeting has been changed'),
                         ('NOTIFICATION_CONF_MEETING_CHANGED', 'Meeting has been changed'),
                         ('NOTIFICATION_CONF_MEETING_RELATION_CHANGED', 'Relation of meeting has been changed'),
                         ('NOTIFICATION_CONF_MEETING_REMINDER', 'Remind of meeting'),
                         ('MAIL_CONF_MEETING_CONFIRMATION', 'Confirmation mail for created meetings'),
                         ('NOTIFICATION_CONF_TASK_USER_CHANGED', 'Assigned users of task has been changed'),
                         ('NOTIFICATION_CONF_TASK_CHANGED', 'Task has been changed'),
                         ('NOTIFICATION_CONF_TASK_RELATION_CHANGED', 'Relation of task has been changed'),
                         ('NOTIFICATION_CONF_PROJECT_USER_CHANGED', 'Users of project has been changed'),
                         ('NOTIFICATION_CONF_PROJECT_CHANGED', 'Project has been changed')], db_index=True,
                max_length=64, verbose_name='Type of the notification (e.g., why it was triggered)'),
        ),
        migrations.AlterField(
            model_name='notificationconfiguration',
            name='allowed_notifications',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(
                choices=[('NOTIFICATION_CONF_MEETING_USER_CHANGED', 'Attended users of meeting has been changed'),
                         ('NOTIFICATION_CONF_MEETING_CHANGED', 'Meeting has been changed'),
                         ('NOTIFICATION_CONF_MEETING_RELATION_CHANGED', 'Relation of meeting has been changed'),
                         ('NOTIFICATION_CONF_MEETING_REMINDER', 'Remind of meeting'),
                         ('MAIL_CONF_MEETING_CONFIRMATION', 'Confirmation mail for created meetings'),
                         ('NOTIFICATION_CONF_TASK_USER_CHANGED', 'Assigned users of task has been changed'),
                         ('NOTIFICATION_CONF_TASK_CHANGED', 'Task has been changed'),
                         ('NOTIFICATION_CONF_TASK_RELATION_CHANGED', 'Relation of task has been changed'),
                         ('NOTIFICATION_CONF_PROJECT_USER_CHANGED', 'Users of project has been changed'),
                         ('NOTIFICATION_CONF_PROJECT_CHANGED', 'Project has been changed')], max_length=64), blank=True,
                default=list, null=True, size=None,
                verbose_name='Notifications that the user want to receive'),
        ),
        migrations.RunPython(opt_in, opt_out),
    ]
