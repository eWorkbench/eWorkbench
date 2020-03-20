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
        ['change_project_contact', 'shared_elements', 'contact'],
        ['change_project_file', 'shared_elements', 'file'],
        ['change_project_note', 'shared_elements', 'note'],
        ['change_project_meeting', 'shared_elements', 'meeting'],
        ['change_project_task', 'shared_elements', 'task'],
    ]

    dependencies = [
        ('projects', '0062_remove_project_from_entities'),
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

