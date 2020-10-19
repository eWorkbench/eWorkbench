#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.contrib.postgres.fields
import django.db.models.deletion
import django_changeset.models.mixins
import django_cleanhtmlfield.fields
import django_userforeignkey.models.fields
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0077_remove_project_state_deleted'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the notification')),
                ('message', django_cleanhtmlfield.fields.HTMLField(verbose_name='Message of the notification')),
                ('notification_type', models.CharField(choices=[('NOTIFICATION_CONF_MEETING_USER_CHANGED', 'Attended users of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_CHANGED', 'Meeting has been changed'), ('NOTIFICATION_CONF_MEETING_RELATION_CHANGED', 'Relation of meeting has been changed'), ('NOTIFICATION_CONF_TASK_USER_CHANGED', 'Assigned users of task has been changed'), ('NOTIFICATION_CONF_TASK_CHANGED', 'Task has been changed'), ('NOTIFICATION_CONF_TASK_RELATION_CHANGED', 'Relation of task has been changed'), ('NOTIFICATION_CONF_PROJECT_USER_CHANGED', 'Users of project has been changed'), ('NOTIFICATION_CONF_PROJECT_CHANGED', 'Project has been changed')], db_index=True, max_length=64, verbose_name='Type of the notification (e.g., why it was triggered)')),
                ('sent', models.DateTimeField(blank=True, null=True, verbose_name='Date when notification was sent')),
                ('processed', models.BooleanField(db_index=True, default=False, verbose_name='If notification was processed')),
                ('read', models.BooleanField(default=False, verbose_name='If user had read the notification')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Date when notification was created')),
                ('object_id', models.UUIDField(blank=True, null=True, verbose_name='Object id of the notification content')),
                ('content_type', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType', verbose_name='Content type of the notification content')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='The user that triggered the notification')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='projects.MyUser', verbose_name='Notifications for the user')),
            ],
            options={
                'verbose_name_plural': 'Notifications',
                'verbose_name': 'Notification',
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='NotificationConfiguration',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('allowed_notifications', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(choices=[('NOTIFICATION_CONF_MEETING_USER_CHANGED', 'Attended users of meeting has been changed'), ('NOTIFICATION_CONF_MEETING_CHANGED', 'Meeting has been changed'), ('NOTIFICATION_CONF_MEETING_RELATION_CHANGED', 'Relation of meeting has been changed'), ('NOTIFICATION_CONF_TASK_USER_CHANGED', 'Assigned users of task has been changed'), ('NOTIFICATION_CONF_TASK_CHANGED', 'Task has been changed'), ('NOTIFICATION_CONF_TASK_RELATION_CHANGED', 'Relation of task has been changed'), ('NOTIFICATION_CONF_PROJECT_USER_CHANGED', 'Users of project has been changed'), ('NOTIFICATION_CONF_PROJECT_CHANGED', 'Project has been changed')], max_length=64), blank=True, default=[], null=True, size=None, verbose_name='Notifications that the user want to receive')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notificationconfiguration_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notificationconfiguration_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification_configuration', to='projects.MyUser', verbose_name='Notification configuration of the user')),
            ],
            options={
                'verbose_name_plural': 'NotificationConfigurations',
                'verbose_name': 'NotificationConfiguration',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
    ]
