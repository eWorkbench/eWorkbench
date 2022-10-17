# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0042_revert_migrate_numeric_task_priority_choices'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='priority',
            field=models.CharField(choices=[('5', 'Very High'), ('4', 'High'), ('3', 'Normal'), ('2', 'Low'), ('1', 'Very Low')], default='3', max_length=5, verbose_name='Priority of the task'),
        ),
    ]
