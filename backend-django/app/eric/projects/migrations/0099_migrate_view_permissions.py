# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0098_add_study_room'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='project',
            options={'ordering': ['name', 'start_date', 'project_state'], 'permissions': (('trash_project', 'Can trash a project'), ('restore_project', 'Can restore a project'), ('invite_external_user', 'Can invite external users'), ('change_parent_project', 'Can change the parent project property')), 'verbose_name': 'Project', 'verbose_name_plural': 'Projects'},
        ),
        migrations.AlterModelOptions(
            name='projectroleuserassignment',
            options={'ordering': ['user__username', 'project']},
        ),
        migrations.AlterModelOptions(
            name='resource',
            options={'ordering': ['name', 'type', 'location', 'description'], 'permissions': (('trash_resource', 'Can trash a resource'), ('restore_resource', 'Can restore a resource'), ('change_project_resource', 'Can change the project of a resource'), ('add_resource_without_project', 'Can add a resource without a project')), 'verbose_name': 'Resource', 'verbose_name_plural': 'Resources'},
        ),
    ]
