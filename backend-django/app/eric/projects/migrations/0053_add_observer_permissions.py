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

        ['view_projectroleuserassignment', 'projects', 'projectroleuserassignment'],

        ['view_resource', 'projects', 'resource'],

        ['view_file', 'shared_elements', 'file'],

        ['view_meeting', 'shared_elements', 'meeting'],

        ['view_note', 'shared_elements', 'note'],

        ['view_task', 'shared_elements', 'task'],

        ['view_contact', 'shared_elements', 'contact'],

        ['view_dmp', 'dmp', 'dmp'],
    ]

    dependencies = [
        ('projects', '0052_add_observer_role'),
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

