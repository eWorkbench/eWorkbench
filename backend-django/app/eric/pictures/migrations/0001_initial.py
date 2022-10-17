# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.contrib.postgres.search
from django.db import migrations, models

import django_changeset.models.mixins

import eric.core.models.abstract


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0074_move_task_meeting_file_contact_note_to_shared_elements'),
    ]

    operations = [
        migrations.CreateModel(
            name='Picture',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the picture')),
                ('width', models.IntegerField(default=512, verbose_name='Width of the picture in pixel')),
                ('height', models.IntegerField(default=512, verbose_name='Height of the picture in pixel')),
                ('background_image', models.ImageField(blank=True, null=True, max_length=512, upload_to='', verbose_name='The background image of the picture')),
                ('rendered_image', models.ImageField(blank=True, null=True, max_length=512, upload_to='', verbose_name='The rendered image of the picture')),
                ('shapes_image', models.FileField(blank=True, null=True, max_length=512, upload_to='', verbose_name='The shapes of the image')),
                ('projects', models.ManyToManyField(blank=True, related_name='pictures', to='projects.Project', verbose_name='Which projects is this picture associated to')),
            ],
            options={
                'verbose_name': 'Picture',
                'ordering': ['title'],
                'verbose_name_plural': 'Pictures',
                'permissions': (('view_picture', 'Can view a picture of a project'), ('trash_picture', 'Can trash a picture'), ('restore_picture', 'Can restore a picture'), ('change_project_picture', 'Can change the project of a picture'), ('add_picture_without_project', 'Can add a picture without a project')),
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model, eric.core.models.abstract.WorkbenchEntityMixin),
        ),
    ]
