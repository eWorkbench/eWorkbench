# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django_changeset.models.mixins
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0070_userprofile_jwt_verification_token'),
    ]

    operations = [
        migrations.CreateModel(
            name='TaskCheckList',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the checklist item')),
                ('checked', models.BooleanField(default=False, verbose_name='Whether this checklist item has been checked or not')),
                ('task', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='checklist_items', to='projects.Task', verbose_name='Which task is checklist item belongs to')),
            ],
            options={
                'verbose_name': 'Task Checklist Item',
                'verbose_name_plural': 'Task Checklist Items',
                'ordering': ['task__task_id', 'title'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
    ]
