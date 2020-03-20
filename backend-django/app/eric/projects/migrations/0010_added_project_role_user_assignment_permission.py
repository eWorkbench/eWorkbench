# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0009_added_change_parent_project_permission'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='projectroleuserassignment',
            options={'permissions': (('view_project_role_user_assignment', 'Can view the project role user assignment'),)},
        ),
    ]
