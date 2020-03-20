# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0047_create_rolepermissionassignments'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='contact',
            options={'ordering': ['first_name', 'last_name', 'project', 'email'], 'permissions': (('view_contact', 'Can view a contact of a project'), ('contact_change_project', 'Can change the project of a contact'), ('add_contact_without_project', 'Can add a contact without a project')), 'verbose_name': 'Contact', 'verbose_name_plural': 'Contacts'},
        ),
        migrations.AlterModelOptions(
            name='file',
            options={'ordering': ['name', 'path'], 'permissions': (('view_file', 'Can view a file of a project'), ('file_change_project', 'Can change the project of a file'), ('add_file_without_project', 'Can add a file without a project')), 'verbose_name': 'File', 'verbose_name_plural': 'Files'},
        ),
        migrations.AlterModelOptions(
            name='meeting',
            options={'ordering': ['title', 'date_time_start', 'date_time_end', 'text'], 'permissions': (('view_meeting', 'Can view a meeting of a project'), ('meeting_change_project', 'Can change the project of a meeting'), ('add_meeting_without_project', 'Can add a meeting without a project')), 'verbose_name': 'Meeting', 'verbose_name_plural': 'Meetings'},
        ),
        migrations.AlterModelOptions(
            name='note',
            options={'ordering': ['subject', 'content'], 'permissions': (('view_note', 'Can view a note of a project'), ('note_change_project', 'Can change the project of a note'), ('add_note_without_project', 'Can add a note without a project')), 'verbose_name': 'Note', 'verbose_name_plural': 'Notes'},
        ),
        migrations.AlterModelOptions(
            name='task',
            options={'ordering': ['task_id', 'title', 'priority', 'due_date', 'state'], 'permissions': (('view_task', 'Can view a task of a project'), ('task_change_project', 'Can change the project of a task'), ('add_task_without_project', 'Can add a task without a project')), 'verbose_name': 'Task', 'verbose_name_plural': 'Tasks'},
        ),
    ]
