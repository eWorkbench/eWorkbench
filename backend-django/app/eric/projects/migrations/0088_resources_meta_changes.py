# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0087_resource_deleted'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='resource',
            options={'ordering': ['name', 'type', 'location', 'description'], 'permissions': (('view_resource', 'Can view a resource of a project'), ('trash_resource', 'Can trash a resource'), ('restore_resource', 'Can restore a resource'), ('change_project_resource', 'Can change the project of a resource'), ('add_resource_without_project', 'Can add a resource without a project')), 'verbose_name': 'Resource', 'verbose_name_plural': 'Resources'},
        ),
    ]
