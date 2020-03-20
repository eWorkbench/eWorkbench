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
        ['view_labbook', 'labbooks', 'labbook'],
    ]

    dependencies = [
        ('labbooks', '0003_pm_add_labbook_permissions'),
    ]

    operations = [
        # migrations.RunPython(forwards_func, reverse_func),
        migrations.RunPython(
            code=lambda *args, **kwargs:
            PermissionMigrationHelper.forwards_func_observer(
                Migration.permissions_to_add, *args, **kwargs
            ),
            reverse_code=lambda *args, **kwargs:
            PermissionMigrationHelper.reverse_func_observer(
                Migration.permissions_to_add, *args, **kwargs
            )
        ),
    ]

