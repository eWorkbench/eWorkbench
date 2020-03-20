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
import eric.core.models.fields
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0074_move_task_meeting_file_contact_note_to_shared_elements'),
    ]

    state_operations = [
        migrations.CreateModel(
            name='Contact',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('first_name', models.CharField(max_length=128, verbose_name='First name of the contact')),
                ('last_name', models.CharField(max_length=128, verbose_name='Last name of the contact')),
                ('email', models.EmailField(max_length=254, verbose_name='Email of the contact')),
                ('phone', models.CharField(blank=True, max_length=128, verbose_name='Phone number of the contact')),
                ('company', models.CharField(blank=True, max_length=128, verbose_name='Company of the contact')),
                ('projects', models.ManyToManyField(blank=True, related_name='contacts', to='projects.Project', verbose_name='Which projects is this contact associated to')),
            ],
            options={
                'verbose_name_plural': 'Contacts',
                'permissions': (('view_contact', 'Can view a contact'), ('trash_contact', 'Can trash a contact'), ('restore_contact', 'Can restore a contact'), ('change_project_contact', 'Can change the project of a contact'), ('add_contact_without_project', 'Can add a contact without a project')),
                'verbose_name': 'Contact',
                'ordering': ['last_name', 'first_name', 'email'],
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='ContactAttendsMeeting',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('contact', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attending_meetings', to='shared_elements.Contact', verbose_name='Attending Contact')),
            ],
            options={
                'verbose_name_plural': 'Contact Meeting Attendances',
                'permissions': (('view_contactattendsmeeting', 'Can view contacts that attend a meeting'),),
                'verbose_name': 'Contact Meeting Attendance',
                'ordering': ['contact', 'meeting'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='File',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=128, verbose_name='Name of the file')),
                ('description', models.TextField(blank=True, verbose_name='Description of the file')),
                ('path', models.FileField(max_length=512, upload_to='', verbose_name='Path of the file')),
                ('mime_type', models.CharField(default='application/octet-stream', max_length=128, verbose_name='Mime type of the uploaded file')),
                ('file_size', models.BigIntegerField(default=0, verbose_name='Size of the file')),
                ('original_filename', models.CharField(max_length=128, verbose_name='Original name of the file')),
                ('projects', models.ManyToManyField(blank=True, related_name='files', to='projects.Project', verbose_name='Which projects is this file associated to')),
            ],
            options={
                'verbose_name_plural': 'Files',
                'permissions': (('view_file', 'Can view a file of a project'), ('trash_file', 'Can trash a file'), ('restore_file', 'Can restore a file'), ('change_project_file', 'Can change the project of a file'), ('add_file_without_project', 'Can add a file without a project')),
                'verbose_name': 'File',
                'ordering': ['name', 'path'],
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Meeting',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the meeting')),
                ('date_time_start', models.DateTimeField(verbose_name='Meeting start date time')),
                ('date_time_end', models.DateTimeField(verbose_name='Meeting end date time')),
                ('text', models.TextField(blank=True, verbose_name='Description of the Meeting')),
                ('attending_contacts', models.ManyToManyField(through='shared_elements.ContactAttendsMeeting', to='shared_elements.Contact')),
            ],
            options={
                'verbose_name_plural': 'Meetings',
                'permissions': (('view_meeting', 'Can view a meeting of a project'), ('trash_meeting', 'Can trash a meeting'), ('restore_meeting', 'Can restore a meeting'), ('change_project_meeting', 'Can change the project of a meeting'), ('add_meeting_without_project', 'Can add a meeting without a project')),
                'verbose_name': 'Meeting',
                'ordering': ['title', 'date_time_start', 'date_time_end', 'text'],
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Note',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('subject', models.CharField(max_length=128, verbose_name='Subject of the note')),
                ('content', models.TextField(blank=True, verbose_name='Content of the note')),
                ('projects', models.ManyToManyField(blank=True, related_name='notes', to='projects.Project', verbose_name='Which projects is this note associated to')),
            ],
            options={
                'verbose_name_plural': 'Notes',
                'permissions': (('view_note', 'Can view a note'), ('trash_note', 'Can trash a note'), ('restore_note', 'Can restore a note'), ('change_project_note', 'Can change the project of a note'), ('add_note_without_project', 'Can add a note without a project')),
                'verbose_name': 'Note',
                'ordering': ['subject', 'content'],
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('task_id', eric.core.models.fields.AutoIncrementIntegerWithPrefixField(db_index=True, default=0, editable=False, verbose_name='Ticket Identifier')),
                ('title', models.CharField(max_length=128, verbose_name='Title of the task')),
                ('start_date', models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Task start date')),
                ('due_date', models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Task due date')),
                ('priority', models.CharField(choices=[('VHIGH', 'Very High'), ('HIGH', 'High'), ('NORM', 'Normal'), ('LOW', 'Low'), ('VLOW', 'Very Low')], default='NORM', max_length=5, verbose_name='Priority of the task')),
                ('state', models.CharField(choices=[('NEW', 'New'), ('PROG', 'In Progress'), ('FIN', 'Finished'), ('TEST', 'Test'), ('CLOSE', 'Closed')], db_index=True, default='NEW', max_length=5, verbose_name='State of the task')),
                ('description', models.TextField(blank=True, verbose_name='Description of the task')),
            ],
            options={
                'verbose_name_plural': 'Tasks',
                'permissions': (('view_task', 'Can view a task of a project'), ('trash_task', 'Can trash a task'), ('restore_task', 'Can restore a task'), ('change_project_task', 'Can change the project of a task'), ('add_task_without_project', 'Can add a task without a project')),
                'verbose_name': 'Task',
                'ordering': ['task_id', 'title', 'priority', 'due_date', 'state'],
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='TaskAssignedUser',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('assigned_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.MyUser', verbose_name='Which user is the task is assigned to')),
                ('task', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='shared_elements.Task', verbose_name='Which task is the user is assigned to')),
            ],
            options={
                'verbose_name_plural': 'Task Assignees',
                'verbose_name': 'Task Assignee',
                'ordering': ['task__task_id', 'assigned_user__username'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='TaskCheckList',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the checklist item')),
                ('checked', models.BooleanField(default=False, verbose_name='Whether this checklist item has been checked or not')),
                ('task', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='checklist_items', to='shared_elements.Task', verbose_name='Which task is checklist item belongs to')),
            ],
            options={
                'verbose_name_plural': 'Task Checklist Items',
                'verbose_name': 'Task Checklist Item',
                'ordering': ['task__task_id', 'title'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='UploadedFileEntry',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('path', models.FileField(max_length=512, upload_to='', verbose_name='Path of the file')),
                ('mime_type', models.CharField(default='application/octet-stream', max_length=128, verbose_name='Mime type of the uploaded file')),
                ('file_size', models.BigIntegerField(verbose_name='Size of the file')),
                ('original_filename', models.CharField(max_length=128, verbose_name='Original name of the file')),
                ('file', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='file_entries', to='shared_elements.File', verbose_name='Which file is this entry related to')),
            ],
            options={
                'ordering': ['path', 'id'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='UserAttendsMeeting',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('meeting', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='shared_elements.Meeting', verbose_name='Attending Meeting')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attending_meetings', to='projects.MyUser', verbose_name='Attending User')),
            ],
            options={
                'verbose_name_plural': 'User Meeting Attendances',
                'permissions': (('view_userattendsmeeting', 'Can view users that attend a meeting'),),
                'verbose_name': 'User Meeting Attendance',
                'ordering': ['user', 'meeting'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.AddField(
            model_name='task',
            name='assigned_users',
            field=models.ManyToManyField(through='shared_elements.TaskAssignedUser', to='projects.MyUser'),
        ),
        migrations.AddField(
            model_name='task',
            name='projects',
            field=models.ManyToManyField(related_name='tasks', to='projects.Project', verbose_name='Which projects is this task associated to'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='attending_users',
            field=models.ManyToManyField(through='shared_elements.UserAttendsMeeting', to='projects.MyUser'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='projects',
            field=models.ManyToManyField(blank=True, related_name='meetings', to='projects.Project', verbose_name='Which projects is this meeting associated to'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='resource',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='meetings', to='projects.Resource', verbose_name='Which resource is booked for this meeting'),
        ),
        migrations.AddField(
            model_name='contactattendsmeeting',
            name='meeting',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='shared_elements.Meeting', verbose_name='Attending Meeting'),
        ),
        migrations.AlterUniqueTogether(
            name='userattendsmeeting',
            unique_together=set([('user', 'meeting')]),
        ),
        migrations.AlterUniqueTogether(
            name='contactattendsmeeting',
            unique_together=set([('contact', 'meeting')]),
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(state_operations=state_operations)
    ]
