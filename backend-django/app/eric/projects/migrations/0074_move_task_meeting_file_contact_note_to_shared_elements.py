# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations

from eric.core.db.migrations import ContentTypeMigrationHelper

list = [
    'Task', 'TaskCheckList', 'TaskAssignedUser', 'Meeting', 'ContactAttendsMeeting', 'UserAttendsMeeting', 'Note',
    'File', 'UploadedFileEntry', 'Contact'
]


def rename_content_type(apps, schema_editor):
    for model in list:
        ContentTypeMigrationHelper.rename_content_type(apps, schema_editor, model, "projects", "shared_elements")


def reverse_rename_content_type(apps, schema_editor):
    for model in list:
        ContentTypeMigrationHelper.reverse_rename_content_type(apps, schema_editor, model, "projects", "shared_elements")


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0073_move_myuser_and_userprofile'),
    ]

    database_operations = [
        migrations.AlterModelTable('Task', 'shared_elements_task'),
        migrations.AlterModelTable('TaskCheckList', 'shared_elements_taskchecklist'),
        migrations.AlterModelTable('TaskAssignedUser', 'shared_elements_taskassigneduser'),
        migrations.AlterModelTable('Meeting', 'shared_elements_meeting'),
        migrations.AlterModelTable('ContactAttendsMeeting', 'shared_elements_contactattendsmeeting'),
        migrations.AlterModelTable('UserAttendsMeeting', 'shared_elements_userattendsmeeting'),
        migrations.AlterModelTable('Note', 'shared_elements_note'),
        migrations.AlterModelTable('File', 'shared_elements_file'),
        migrations.AlterModelTable('UploadedFileEntry', 'shared_elements_uploadedfileentry'),
        migrations.AlterModelTable('Contact', 'shared_elements_contact'),
    ]

    state_operations = [
        migrations.DeleteModel('Task'),
        migrations.DeleteModel('TaskCheckList'),
        migrations.DeleteModel('TaskAssignedUser'),
        migrations.DeleteModel('Meeting'),
        migrations.DeleteModel('ContactAttendsMeeting'),
        migrations.DeleteModel('UserAttendsMeeting'),
        migrations.DeleteModel('Note'),
        migrations.DeleteModel('File'),
        migrations.DeleteModel('UploadedFileEntry'),
        migrations.DeleteModel('Contact'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=database_operations,
            state_operations=state_operations),
        migrations.RunPython(
            rename_content_type, reverse_rename_content_type
        ),
    ]
