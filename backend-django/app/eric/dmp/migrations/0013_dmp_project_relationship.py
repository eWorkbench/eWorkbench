# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0062_remove_project_from_entities'),
        ('dmp', '0012_create_role_permission_assignment'),
    ]

    operations = [
        migrations.AddField(
            model_name='dmp',
            name='projects',
            field=models.ManyToManyField(related_name='dmps', to='projects.Project', verbose_name='Which projects is this dmp associated to'),
        ),
        migrations.AlterField(
            model_name='dmp',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='projects.Project', verbose_name='Which project is this dmp associated to'),
        ),
    ]
