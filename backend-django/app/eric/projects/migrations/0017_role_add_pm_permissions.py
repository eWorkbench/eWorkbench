# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models

from eric.core.db.migrations import PermissionMigrationHelper


class Migration(migrations.Migration):
    permissions_to_add = [
        # codename, app, model
        ['view_project', 'projects', 'project'],
        ['delete_project', 'projects', 'project'],
        ['change_project', 'projects', 'project'],
        ['change_parent_project', 'projects', 'project'],

        ['add_projectroleuserassignment', 'projects', 'projectroleuserassignment'],
        ['view_projectroleuserassignment', 'projects', 'projectroleuserassignment'],
        ['change_projectroleuserassignment', 'projects', 'projectroleuserassignment'],
        ['delete_projectroleuserassignment', 'projects', 'projectroleuserassignment'],

        ['add_resource', 'projects', 'resource'],
        ['change_resource', 'projects', 'resource'],
        ['delete_resource', 'projects', 'resource'],

        ['view_file', 'shared_elements', 'file'],
        ['add_file', 'shared_elements', 'file'],
        ['change_file', 'shared_elements', 'file'],
        ['delete_file', 'shared_elements', 'file'],
        ['file_change_project', 'shared_elements', 'file'],

        ['view_meeting', 'shared_elements', 'meeting'],
        ['add_meeting', 'shared_elements', 'meeting'],
        ['change_meeting', 'shared_elements', 'meeting'],
        ['delete_meeting', 'shared_elements', 'meeting'],
        ['meeting_change_project', 'shared_elements', 'meeting'],

        ['view_note', 'shared_elements', 'note'],
        ['add_note', 'shared_elements', 'note'],
        ['change_note', 'shared_elements', 'note'],
        ['delete_note', 'shared_elements', 'note'],
        ['note_change_project', 'shared_elements', 'note'],

        ['view_task', 'shared_elements', 'task'],
        ['add_task', 'shared_elements', 'task'],
        ['change_task', 'shared_elements', 'task'],
        ['delete_task', 'shared_elements', 'task'],
        ['task_change_project', 'shared_elements', 'task'],

        ['view_contact', 'shared_elements', 'contact'],
        ['add_contact', 'shared_elements', 'contact'],
        ['change_contact', 'shared_elements', 'contact'],
        ['delete_contact', 'shared_elements', 'contact'],
        ['contact_change_project', 'shared_elements', 'contact']
    ]

    dependencies = [
        ('projects', '0016_role_add_default_roles'),
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

