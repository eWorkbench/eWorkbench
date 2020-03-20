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
        # drives
        ['restore_drive', 'drives', 'drive'],
        ['trash_drive', 'drives', 'drive'],
        ['view_drive', 'drives', 'drive'],
        ['add_drive', 'drives', 'drive'],
        ['change_drive', 'drives', 'drive'],
        ['delete_drive', 'drives', 'drive'],
        ['change_project_drive', 'drives', 'drive']
    ]

    dependencies = [
        ('drives', '0002_add_create_without_project_permission_to_user_group'),
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

