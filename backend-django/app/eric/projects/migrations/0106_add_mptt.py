# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.db.models.deletion
from django.db import migrations, models

import mptt.fields


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0105_resource_calendar_interval'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='level',
            field=models.PositiveIntegerField(default=0, editable=False),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='project',
            name='lft',
            field=models.PositiveIntegerField(default=0, editable=False),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='project',
            name='rght',
            field=models.PositiveIntegerField(default=0, editable=False),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='project',
            name='tree_id',
            field=models.PositiveIntegerField(db_index=True, default=0, editable=False),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='project',
            name='parent_project',
            field=mptt.fields.TreeForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sub_projects', to='projects.Project', verbose_name='Parent Project'),
        ),
    ]
