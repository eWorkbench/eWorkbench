# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.contrib.postgres.search
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_changeset.models.mixins
import django_userforeignkey.models.fields

import eric.core.models.abstract


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0075_changesets'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Directory',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the directory')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='directory_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
            ],
            options={
                'verbose_name_plural': 'Directories',
                'verbose_name': 'Directory',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='Drive',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the drive')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='drive_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='drive_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('projects', models.ManyToManyField(blank=True, related_name='drives', to='projects.Project', verbose_name='Which projects is this drive associated to')),
            ],
            options={
                'verbose_name_plural': 'Drives',
                'permissions': (('view_drive', 'Can view a drive'), ('trash_drive', 'Can trash a drive'), ('restore_drive', 'Can restore a drive'), ('change_project_drive', 'Can change the project of a drive'), ('add_drive_without_project', 'Can add a drive without a project')),
                'verbose_name': 'Drive',
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model, eric.core.models.abstract.WorkbenchEntityMixin),
        ),
        migrations.AddField(
            model_name='directory',
            name='drive',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sub_directories', to='drives.Drive', verbose_name='Which Drive this directory is mapped to'),
        ),
        migrations.AddField(
            model_name='directory',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='directory_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='directory',
            name='parent_directory',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sub_directories', to='drives.Directory', verbose_name='Parent Directory'),
        ),
    ]
