# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models

from eric.core.db.migrations import PermissionContentTypeApplyMigration, PermissionMigrationHelper


class Migration(PermissionContentTypeApplyMigration):
    permissions_to_add = [
        # codename, app, model

        ['view_dmp', 'dmp', 'dmp'],
        ['add_dmp', 'dmp', 'dmp'],
        ['change_dmp', 'dmp', 'dmp'],
        ['delete_dmp', 'dmp', 'dmp']
    ]

    dependencies = [
        ('projects', '0017_role_add_pm_permissions'),
        ('dmp', '0005_dmp_form_data_change_related_field_name'),
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

