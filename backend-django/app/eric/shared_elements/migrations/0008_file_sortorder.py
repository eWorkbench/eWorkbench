# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0007_file_directory'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='file',
            options={'ordering': ['name', 'original_filename'], 'permissions': (('view_file', 'Can view a file of a project'), ('trash_file', 'Can trash a file'), ('restore_file', 'Can restore a file'), ('change_project_file', 'Can change the project of a file'), ('add_file_without_project', 'Can add a file without a project')), 'verbose_name': 'File', 'verbose_name_plural': 'Files'},
        ),
    ]
