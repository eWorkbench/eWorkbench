#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0005_reminder_opt_in'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notificationconfiguration',
            name='allowed_notifications',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(choices=[('NOTIFICATION_CONF_MEETING_USER_CHANGED', 'Attended users of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_CHANGED', 'Meeting has been changed'), ('NOTIFICATION_CONF_MEETING_RELATION_CHANGED', 'Relation of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_REMINDER', 'Remind of meeting'), ('NOTIFICATION_CONF_TASK_USER_CHANGED', 'Assigned users of task has been changed'), ('NOTIFICATION_CONF_TASK_CHANGED', 'Task has been changed'), ('NOTIFICATION_CONF_TASK_RELATION_CHANGED', 'Relation of task has been changed'), ('NOTIFICATION_CONF_PROJECT_USER_CHANGED', 'Users of project has been changed'), ('NOTIFICATION_CONF_PROJECT_CHANGED', 'Project has been changed')], max_length=64), blank=True, default=list, null=True, size=None, verbose_name='Notifications that the user want to receive'),
        ),
    ]
