# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0012_add_project_comment_notification_configuration'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(choices=[('NOTIFICATION_CONF_MEETING_USER_CHANGED', 'Attended users of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_CHANGED', 'Meeting has been changed'), ('NOTIFICATION_CONF_MEETING_RELATION_CHANGED', 'Relation of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_REMINDER', 'Remind of meeting'), ('MAIL_CONF_MEETING_CONFIRMATION', 'Confirmation mail for created meetings'), ('NOTIFICATION_CONF_TASK_USER_CHANGED', 'Assigned users of task has been changed'), ('NOTIFICATION_CONF_TASK_CHANGED', 'Task has been changed'), ('NOTIFICATION_CONF_TASK_RELATION_CHANGED', 'Relation of task has been changed'), ('NOTIFICATION_CONF_TASK_REMINDER', 'Remind of task'), ('NOTIFICATION_CONF_PROJECT_USER_CHANGED', 'Users of project has been changed'), ('NOTIFICATION_CONF_PROJECT_CHANGED', 'Project has been changed'), ('NOTIFICATION_CONF_PROJECT_COMMENT', 'A new project comment has been posted'), ('NOTIFICATION_DSS_IMPORT_IN_PROGRESS', 'DSS import in progress'), ('NOTIFICATION_DSS_IMPORT_FINISHED', 'DSS import finished'), ('NOTIFICATION_DSS_IMPORT_FAILED', 'DSS import failed')], db_index=True, max_length=64, verbose_name='Type of the notification (e.g., why it was triggered)'),
        ),
        migrations.AlterField(
            model_name='notificationconfiguration',
            name='allowed_notifications',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(choices=[('NOTIFICATION_CONF_MEETING_USER_CHANGED', 'Attended users of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_CHANGED', 'Meeting has been changed'), ('NOTIFICATION_CONF_MEETING_RELATION_CHANGED', 'Relation of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_REMINDER', 'Remind of meeting'), ('MAIL_CONF_MEETING_CONFIRMATION', 'Confirmation mail for created meetings'), ('NOTIFICATION_CONF_TASK_USER_CHANGED', 'Assigned users of task has been changed'), ('NOTIFICATION_CONF_TASK_CHANGED', 'Task has been changed'), ('NOTIFICATION_CONF_TASK_RELATION_CHANGED', 'Relation of task has been changed'), ('NOTIFICATION_CONF_TASK_REMINDER', 'Remind of task'), ('NOTIFICATION_CONF_PROJECT_USER_CHANGED', 'Users of project has been changed'), ('NOTIFICATION_CONF_PROJECT_CHANGED', 'Project has been changed'), ('NOTIFICATION_CONF_PROJECT_COMMENT', 'A new project comment has been posted'), ('NOTIFICATION_DSS_IMPORT_IN_PROGRESS', 'DSS import in progress'), ('NOTIFICATION_DSS_IMPORT_FINISHED', 'DSS import finished'), ('NOTIFICATION_DSS_IMPORT_FAILED', 'DSS import failed')], max_length=64), blank=True, default=list, null=True, size=None, verbose_name='Notifications that the user want to receive'),
        ),
    ]
