# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals
from django.db import migrations, models
from eric.core.db.migrations import PermissionMigrationHelper


class Migration(migrations.Migration):
    permissions_to_add = [
        # codename, app, model
        # projects
        ['restore_project', 'projects', 'project'],
        ['trash_project', 'projects', 'project'],
        # tasks
        ['restore_task', ['projects', 'shared_elements'], 'task'],
        ['trash_task', ['projects', 'shared_elements'], 'task'],
        # meetings
        ['restore_meeting', ['projects', 'shared_elements'], 'meeting'],
        ['trash_meeting', ['projects', 'shared_elements'], 'meeting'],
        # contacts
        ['restore_contact', ['projects', 'shared_elements'], 'contact'],
        ['trash_contact', ['projects', 'shared_elements'], 'contact'],
        # notes
        ['restore_note', ['projects', 'shared_elements'], 'note'],
        ['trash_note', ['projects', 'shared_elements'], 'note'],
        # files
        ['restore_file', ['projects', 'shared_elements'], 'file'],
        ['trash_file', ['projects', 'shared_elements'], 'file'],
        # dmps
        ['restore_dmp', 'dmp', 'dmp'],
        ['trash_dmp', 'dmp', 'dmp'],
    ]

    dependencies = [
        ('projects', '0068_permissions_trash_restore'),
    ]

    operations = [
        # migrations.RunPython(forwards_func, reverse_func),
        migrations.RunPython(
            code=lambda *args, **kwargs:
            PermissionMigrationHelper.forwards_func_project_manager(
                Migration.permissions_to_add, *args, **kwargs
            ),
            reverse_code=lambda *args, **kwargs:
            PermissionMigrationHelper.reverse_func_project_manager(
                Migration.permissions_to_add, *args, **kwargs
            )
        ),
    ]

