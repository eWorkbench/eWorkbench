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
        ['view_userattendsmeeting', 'shared_elements', 'userattendsmeeting'],
        ['add_userattendsmeeting', 'shared_elements', 'userattendsmeeting'],
        ['change_userattendsmeeting', 'shared_elements', 'userattendsmeeting'],
        ['delete_userattendsmeeting', 'shared_elements', 'userattendsmeeting'],

        ['view_contactattendsmeeting', 'shared_elements', 'contactattendsmeeting'],
        ['add_contactattendsmeeting', 'shared_elements', 'contactattendsmeeting'],
        ['change_contactattendsmeeting', 'shared_elements', 'contactattendsmeeting'],
        ['delete_contactattendsmeeting', 'shared_elements', 'contactattendsmeeting'],
    ]

    dependencies = [
        ('projects', '0028_rename_meeting_permissions'),
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

