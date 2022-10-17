# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('drives', '0008_directory_is_virtual_root'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='drive',
            options={'permissions': (('trash_drive', 'Can trash a drive'), ('restore_drive', 'Can restore a drive'), ('change_project_drive', 'Can change the project of a drive'), ('add_drive_without_project', 'Can add a drive without a project')), 'verbose_name': 'Drive', 'verbose_name_plural': 'Drives'},
        ),
    ]
