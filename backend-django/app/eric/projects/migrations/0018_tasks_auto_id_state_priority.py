# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import eric.core.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0017_role_add_pm_permissions'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='projectroleuserassignment',
            options={'ordering': ['user__username', 'project'], 'permissions': (('view_projectroleuserassignment', 'Can view the project role user assignment'),)},
        ),
        migrations.AlterModelOptions(
            name='role',
            options={'ordering': ['-default_role_on_project_create', 'name']},
        ),
        migrations.AddField(
            model_name='task',
            name='task_id',
            field=eric.core.models.fields.AutoIncrementIntegerWithPrefixField(db_index=True, default=0, editable=False, verbose_name='Ticket Identifier'),
        ),
        migrations.AlterField(
            model_name='task',
            name='priority',
            field=models.CharField(choices=[('VHIGH', 'Very High'), ('HIGH', 'High'), ('NORM', 'Normal'), ('LOW', 'Low'), ('VLOW', 'Very Low')], default='NORM', max_length=5, verbose_name='Priority of the task'),
        ),
        migrations.AlterField(
            model_name='task',
            name='state',
            field=models.CharField(choices=[('NEW', 'New'), ('PROG', 'In Progress'), ('TEST', 'Test'), ('CLOSE', 'Closed')], default='NEW', max_length=5, verbose_name='State of the task'),
        ),
    ]
