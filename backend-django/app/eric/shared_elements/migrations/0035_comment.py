# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

import django.contrib.postgres.search
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_changeset.models.mixins
import django_cleanhtmlfield.fields
import django_userforeignkey.models.fields

import eric.core.models.abstract
import eric.core.models.base


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0105_resource_calendar_interval'),
        ('shared_elements', '0034_add_task_checklist_ordering'),
    ]

    operations = [
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('content', django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Content of the comment')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='comment_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='comment_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('projects', models.ManyToManyField(blank=True, related_name='comments', to='projects.Project', verbose_name='Which projects is this comment associated to')),
            ],
            options={
                'verbose_name': 'Comment',
                'verbose_name_plural': 'Comments',
                'ordering': ['created_at'],
                'permissions': (('trash_comment', 'Can trash a comment'), ('restore_comment', 'Can restore a comment'), ('change_project_comment', 'Can change the project of a comment'), ('add_comment_without_project', 'Can add a comment without a project')),
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, eric.core.models.base.LockMixin, eric.core.models.abstract.WorkbenchEntityMixin, models.Model),
        ),
    ]
