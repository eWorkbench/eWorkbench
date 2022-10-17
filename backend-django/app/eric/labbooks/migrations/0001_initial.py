# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.contrib.postgres.search
import django.db.models.deletion
from django.db import migrations, models

import django_changeset.models.mixins


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0074_move_task_meeting_file_contact_note_to_shared_elements'),
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='LabBook',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the labbook')),
                ('is_template', models.BooleanField(default=False, verbose_name='Whether this labbook is a template or not')),
                ('projects', models.ManyToManyField(blank=True, related_name='labbooks', to='projects.Project', verbose_name='Which projects is this labbook associated to')),
            ],
            options={
                'verbose_name': 'LabBook',
                'verbose_name_plural': 'LabBooks',
                'permissions': (('view_labbook', 'Can view a labbook'), ('trash_labbook', 'Can trash a labbook'), ('restore_labbook', 'Can restore a labbook'), ('change_project_labbook', 'Can change the project of a labbook'), ('add_labbook_without_project', 'Can add a labbook without a project')),
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='LabBookChildElement',
            fields=[
                ('ordering', models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('position_x', models.IntegerField(verbose_name='The x position of the labbook child element within the grid')),
                ('position_y', models.IntegerField(verbose_name='The y position of the labbook child element within the grid')),
                ('width', models.IntegerField(verbose_name='The width of the child element within the grid')),
                ('height', models.IntegerField(verbose_name='The height of the child element within the grid')),
                ('child_object_id', models.UUIDField(verbose_name='ID of the child element')),
                ('child_object_content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType', verbose_name='ContentType of the child element')),
                ('lab_book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='child_elements', to='labbooks.LabBook', verbose_name='Which labbook this element is a child of')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
            ],
            options={
                'verbose_name_plural': 'Child elements of a labbook',
                'verbose_name': 'Child element of a labbook',
                'ordering': ('ordering',),
            },
        ),
    ]
