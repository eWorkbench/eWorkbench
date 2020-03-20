# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_changeset.models.mixins
import eric.projects.models.models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Contact',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('first_name', models.CharField(max_length=128, verbose_name='First name of the contact')),
                ('last_name', models.CharField(max_length=128, verbose_name='Last name of the contact')),
                ('email', models.EmailField(max_length=254, verbose_name='Email of the contact')),
            ],
            options={
                'verbose_name_plural': 'Contacts',
                'permissions': (('view_contact', 'todo'), ('contact_change_project', 'Can change the project of a contact')),
                'ordering': ['first_name', 'last_name', 'project', 'email'],
                'verbose_name': 'Contact',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='File',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=128, verbose_name='Name of the file')),
                ('path', models.FileField(upload_to='', verbose_name='Path of the file')),
                ('original_filename', models.CharField(max_length=128, verbose_name='Original name of the file')),
            ],
            options={
                'verbose_name_plural': 'Files',
                'permissions': (('view_file', 'todo'), ('file_change_project', 'Can change the project of a file')),
                'ordering': ['name', 'path'],
                'verbose_name': 'File',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='Meeting',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the meeting')),
                ('date_time', models.DateTimeField(verbose_name='Meeting date time')),
                ('text', models.TextField(blank=True, verbose_name='Description of the Meeting')),
            ],
            options={
                'verbose_name_plural': 'Meetings',
                'permissions': (('view_meeting', 'todo'), ('meeting_change_project', 'Can change the project of a meeting')),
                'ordering': ['title', 'date_time', 'text'],
                'verbose_name': 'Meeting',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='Note',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('subject', models.CharField(max_length=128, verbose_name='Subject of the note')),
                ('content', models.TextField(blank=True, verbose_name='Actual content of the note')),
            ],
            options={
                'verbose_name_plural': 'Notes',
                'permissions': (('view_note', 'todo'), ('note_change_project', 'Can change the project of a note')),
                'ordering': ['subject', 'content'],
                'verbose_name': 'Note',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=128, verbose_name='Name of the Project')),
                ('description', models.TextField(blank=True, verbose_name='Description of the Project')),
                ('project_state', models.CharField(choices=[('INIT', 'Initialized'), ('START', 'Started'), ('PAUSE', 'Paused'), ('FIN', 'Finished'), ('CANCE', 'Cancelled')], default='INIT', max_length=5, verbose_name='State of the Project')),
                ('start_date', models.DateTimeField(blank=True, null=True, verbose_name='Project start date')),
                ('stop_date', models.DateTimeField(blank=True, null=True, verbose_name='Project stop date')),
                ('parent_project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sub_projects', to='projects.Project', verbose_name='Parent Project')),
            ],
            options={
                'verbose_name_plural': 'Projects',
                'permissions': (('view_project', 'Can view project'), ('view_all_projects', 'Can see all available projects'), ('change_project_state', 'Can change the project state'), ('change_project_name', 'Change the name of the project')),
                'ordering': ['project_state'],
                'verbose_name': 'Project',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the task')),
                ('due_date', models.DateTimeField(verbose_name='Task due date')),
                ('priority', models.CharField(max_length=5, verbose_name='Priority of the task')),
                ('state', models.CharField(choices=[('INIT', 'Initialized'), ('START', 'Started'), ('PAUSE', 'Paused'), ('FIN', 'Finished'), ('CANCE', 'Cancelled')], default='INIT', max_length=5, verbose_name='State of the task')),
                ('description', models.TextField(blank=True, verbose_name='Description of the task')),
                ('assigned_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_tasks', to=settings.AUTH_USER_MODEL, verbose_name='Which user is this task associated to')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='projects.Project', verbose_name='Which project is this task associated to')),
            ],
            options={
                'verbose_name_plural': 'Tasks',
                'permissions': (('view_task', 'todo'), ('task_change_project', 'Can change the project of a task'), ('change_task_state', 'Can change the task state')),
                'ordering': ['title', 'priority', 'due_date', 'state'],
                'verbose_name': 'Task',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('skype_name', models.CharField(blank=True, max_length=100, verbose_name='Skype name of the user')),
                ('academic_title', models.CharField(blank=True, max_length=100, verbose_name='Academic title of the user')),
                ('website', models.URLField(blank=True, verbose_name='Website of the user')),
                ('avatar', models.ImageField(default='unknown_user.gif', height_field='avatar_height', max_length=255, upload_to=eric.projects.models.UploadToPathAndRename('profile_pictures'), width_field='avatar_width')),
                ('avatar_height', models.PositiveIntegerField(blank=True, editable=False, null=True)),
                ('avatar_width', models.PositiveIntegerField(blank=True, editable=False, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
                'ordering': ['-pk'],
            },
        ),
        migrations.AddField(
            model_name='note',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='projects.Project', verbose_name='Which project is this note associated to'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meetings', to='projects.Project', verbose_name='Which project is this meeting associated to'),
        ),
        migrations.AddField(
            model_name='file',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='files', to='projects.Project', verbose_name='Which project is this file associated to'),
        ),
        migrations.AddField(
            model_name='contact',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contacts', to='projects.Project', verbose_name='Which project is this contact associated to'),
        ),
    ]
