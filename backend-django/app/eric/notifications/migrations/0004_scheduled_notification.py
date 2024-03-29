#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.contrib.postgres.fields
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_changeset.models.mixins
import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('contenttypes', '0002_remove_content_type_name'),
        ('notifications', '0003_title_textfield'),
    ]

    operations = [
        migrations.CreateModel(
            name='ScheduledNotification',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('scheduled_date_time', models.DateTimeField(verbose_name='Scheduled date time')),
                ('timedelta_value', models.IntegerField(default=1, verbose_name='Time value when the notification should created')),
                ('timedelta_unit', models.CharField(choices=[('MINUTE', 'minutes'), ('HOUR', 'hours'), ('DAY', 'days'), ('WEEK', 'weeks')], default='DAY', max_length=6, verbose_name='Time unit when the notification should be created')),
                ('active', models.BooleanField(db_index=True, default=False, verbose_name='If scheduled notification is active')),
                ('processed', models.BooleanField(db_index=True, default=False, verbose_name='If scheduled notification was processed')),
                ('object_id', models.UUIDField(blank=True, null=True, unique=True, verbose_name='Object id of the scheduled notification content')),
                ('content_type', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType', verbose_name='Content type')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='schedulednotification_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='schedulednotification_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
            ],
            options={
                'verbose_name_plural': 'ScheduledNotifications',
                'verbose_name': 'ScheduledNotification',
            },
        ),
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(choices=[('NOTIFICATION_CONF_MEETING_USER_CHANGED', 'Attended users of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_CHANGED', 'Meeting has been changed'), ('NOTIFICATION_CONF_MEETING_RELATION_CHANGED', 'Relation of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_REMINDER', 'Remind of meeting'), ('NOTIFICATION_CONF_TASK_USER_CHANGED', 'Assigned users of task has been changed'), ('NOTIFICATION_CONF_TASK_CHANGED', 'Task has been changed'), ('NOTIFICATION_CONF_TASK_RELATION_CHANGED', 'Relation of task has been changed'), ('NOTIFICATION_CONF_PROJECT_USER_CHANGED', 'Users of project has been changed'), ('NOTIFICATION_CONF_PROJECT_CHANGED', 'Project has been changed')], db_index=True, max_length=64, verbose_name='Type of the notification (e.g., why it was triggered)'),
        ),
        migrations.AlterField(
            model_name='notificationconfiguration',
            name='allowed_notifications',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(choices=[('NOTIFICATION_CONF_MEETING_USER_CHANGED', 'Attended users of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_CHANGED', 'Meeting has been changed'), ('NOTIFICATION_CONF_MEETING_RELATION_CHANGED', 'Relation of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_REMINDER', 'Remind of meeting'), ('NOTIFICATION_CONF_TASK_USER_CHANGED', 'Assigned users of task has been changed'), ('NOTIFICATION_CONF_TASK_CHANGED', 'Task has been changed'), ('NOTIFICATION_CONF_TASK_RELATION_CHANGED', 'Relation of task has been changed'), ('NOTIFICATION_CONF_PROJECT_USER_CHANGED', 'Users of project has been changed'), ('NOTIFICATION_CONF_PROJECT_CHANGED', 'Project has been changed')], max_length=64), blank=True, default=[], null=True, size=None, verbose_name='Notifications that the user want to receive'),
        ),
    ]
