# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('labbooks', '0010_sections_add_fts'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='labbooksection',
            options={'ordering': ['date', 'title'], 'permissions': (
            ('trash_labbooksection', 'Can trash a LabBook section'),
            ('restore_labbooksection', 'Can restore a LabBook section'),
            ('change_project_labbooksection', 'Can change the project of a LabBook section'),
            ('add_labbooksection_without_project', 'Can add a LabBook section without a project')),
                     'verbose_name': 'LabbookSection', 'verbose_name_plural': 'LabbookSections'},
        ),
        migrations.AlterModelOptions(
            name='labbook',
            options={'permissions': (
                ('trash_labbook', 'Can trash a labbook'), ('restore_labbook', 'Can restore a labbook'),
                ('change_project_labbook', 'Can change the project of a labbook'),
                ('add_labbook_without_project', 'Can add a labbook without a project')), 'verbose_name': 'LabBook',
                'verbose_name_plural': 'LabBooks'},
        ),
    ]
