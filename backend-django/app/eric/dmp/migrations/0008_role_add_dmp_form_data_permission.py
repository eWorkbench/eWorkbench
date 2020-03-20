# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals
from django.db import migrations, models
from eric.core.db.migrations import PermissionMigrationHelper, PermissionContentTypeApplyMigration


class Migration(PermissionContentTypeApplyMigration):
    permissions_to_add = [
        # codename, app, model

        ['change_dmpformdata', 'dmp', 'dmpformdata']
    ]

    dependencies = [
        ('projects', '0017_role_add_pm_permissions'),
        ('dmp', '0007_dmp_form_data_add_ordering'),
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

