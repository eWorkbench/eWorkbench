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
        # kanban_boards
        ['restore_kanbanboard', 'kanban_boards', 'kanbanboard'],
        ['trash_kanbanboard', 'kanban_boards', 'kanbanboard'],
        ['view_kanbanboard', 'kanban_boards', 'kanbanboard'],
        ['add_kanbanboard', 'kanban_boards', 'kanbanboard'],
        ['change_kanbanboard', 'kanban_boards', 'kanbanboard'],
        ['delete_kanbanboard', 'kanban_boards', 'kanbanboard'],
        ['change_project_kanbanboard', 'kanban_boards', 'kanbanboard']
    ]

    dependencies = [
        ('kanban_boards', '0002_add_create_without_project_permission_to_user_group'),
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

