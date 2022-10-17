# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_changeset.models.mixins


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0055_textlabels'),
    ]

    operations = [
        migrations.CreateModel(
            name='TaskAssignedUser',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('assigned_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='Which user is the task is assigned to')),
                ('task', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='projects.Task', verbose_name='Which task is the user is assigned to')),
            ],
            options={
                'ordering': ['task__task_id', 'assigned_user__username'],
                'verbose_name': 'Task Assignee',
                'verbose_name_plural': 'Task Assignees',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.AddField(
            model_name='task',
            name='assigned_users',
            field=models.ManyToManyField(through='projects.TaskAssignedUser', to=settings.AUTH_USER_MODEL),
        ),
    ]
