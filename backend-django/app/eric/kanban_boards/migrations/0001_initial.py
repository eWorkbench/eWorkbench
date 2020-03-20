# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.postgres.search
from django.db import migrations, models
import django.db.models.deletion
import django_changeset.models.mixins
import eric.core.models.abstract
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0074_move_task_meeting_file_contact_note_to_shared_elements'),
        ('shared_elements', '0002_note_content_to_html_content'),
    ]

    operations = [
        migrations.CreateModel(
            name='KanbanBoard',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the Kanban Board')),
                ('board_type', models.CharField(choices=[('per', 'Personal'), ('pro', 'Project')], default='pro', max_length=3, verbose_name='Type of the Kanban Board')),
                ('projects', models.ManyToManyField(blank=True, related_name='kanban_boards', to='projects.Project', verbose_name='Which projects is this Kanban Board associated to')),
            ],
            options={
                'verbose_name_plural': 'Kanban Boards',
                'permissions': (('view_kanbanboard', 'Can view a Kanban Board of a project'), ('trash_kanbanboard', 'Can trash a Kanban Board'), ('restore_kanbanboard', 'Can restore a Kanban Board'), ('change_project_kanbanboard', 'Can change the project of a Kanban Board'), ('add_kanbanboard_without_project', 'Can add a Kanban Board without a project')),
                'verbose_name': 'Kanban Board',
                'ordering': ['title'],
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model, eric.core.models.abstract.WorkbenchEntityMixin),
        ),
        migrations.CreateModel(
            name='KanbanBoardColumn',
            fields=[
                ('ordering', models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the Kanban Board')),
                ('color', models.CharField(default='rgba(255,255,255,1)', max_length=30, validators=[django.core.validators.RegexValidator('^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*(\\d+(?:\\.\\d+)?))?\\)$', 'Not a valid RGBA color')], verbose_name='RGBA color of the column')),
                ('task_state', models.CharField(choices=[('NEW', 'New'), ('PROG', 'In Progress'), ('FIN', 'Finished'), ('TEST', 'Test'), ('CLOSE', 'Closed')], db_index=True, default='NEW', max_length=5, verbose_name='Which task state should tasks in this kanban board column be related to')),
                ('kanban_board', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='kanban_board_columns', to='kanban_boards.KanbanBoard', verbose_name='Which kanban board is this column assigned to')),
            ],
            options={
                'verbose_name_plural': 'Kanban Board Columns',
                'verbose_name': 'Kanban Board Column',
                'ordering': ['ordering', 'title'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='KanbanBoardColumnTaskAssignment',
            fields=[
                ('ordering', models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('kanban_board_column', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='kanban_boards.KanbanBoardColumn')),
                ('task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='shared_elements.Task')),
            ],
            options={
                'verbose_name_plural': 'Kanban Board Columns',
                'verbose_name': 'Kanban Board Column',
                'ordering': ['ordering'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.AddField(
            model_name='kanbanboardcolumn',
            name='tasks',
            field=models.ManyToManyField(through='kanban_boards.KanbanBoardColumnTaskAssignment', to='shared_elements.Task', verbose_name='The tasks of this column'),
        ),
    ]
