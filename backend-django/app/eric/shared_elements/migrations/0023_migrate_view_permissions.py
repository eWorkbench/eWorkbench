# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0022_meetings_remove_resources'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='contact',
            options={'ordering': ['last_name', 'first_name', 'email'], 'permissions': (('trash_contact', 'Can trash a contact'), ('restore_contact', 'Can restore a contact'), ('change_project_contact', 'Can change the project of a contact'), ('add_contact_without_project', 'Can add a contact without a project')), 'verbose_name': 'Contact', 'verbose_name_plural': 'Contacts'},
        ),
        migrations.AlterModelOptions(
            name='contactattendsmeeting',
            options={'ordering': ['contact', 'meeting'], 'verbose_name': 'Contact Meeting Attendance', 'verbose_name_plural': 'Contact Meeting Attendances'},
        ),
        migrations.AlterModelOptions(
            name='file',
            options={'ordering': ['name', 'original_filename'], 'permissions': (('trash_file', 'Can trash a file'), ('restore_file', 'Can restore a file'), ('change_project_file', 'Can change the project of a file'), ('add_file_without_project', 'Can add a file without a project')), 'verbose_name': 'File', 'verbose_name_plural': 'Files'},
        ),
        migrations.AlterModelOptions(
            name='meeting',
            options={'ordering': ['title', 'date_time_start', 'date_time_end', 'text'], 'permissions': (('trash_meeting', 'Can trash a meeting'), ('restore_meeting', 'Can restore a meeting'), ('change_project_meeting', 'Can change the project of a meeting'), ('add_meeting_without_project', 'Can add a meeting without a project')), 'verbose_name': 'Meeting', 'verbose_name_plural': 'Meetings'},
        ),
        migrations.AlterModelOptions(
            name='note',
            options={'ordering': ['subject', 'content'], 'permissions': (('trash_note', 'Can trash a note'), ('restore_note', 'Can restore a note'), ('change_project_note', 'Can change the project of a note'), ('add_note_without_project', 'Can add a note without a project')), 'verbose_name': 'Note', 'verbose_name_plural': 'Notes'},
        ),
        migrations.AlterModelOptions(
            name='task',
            options={'ordering': ['task_id', 'title', 'priority', 'due_date', 'state'], 'permissions': (('trash_task', 'Can trash a task'), ('restore_task', 'Can restore a task'), ('change_project_task', 'Can change the project of a task'), ('add_task_without_project', 'Can add a task without a project')), 'verbose_name': 'Task', 'verbose_name_plural': 'Tasks'},
        ),
        migrations.AlterModelOptions(
            name='userattendsmeeting',
            options={'ordering': ['user', 'meeting'], 'verbose_name': 'User Meeting Attendance', 'verbose_name_plural': 'User Meeting Attendances'},
        ),
    ]
