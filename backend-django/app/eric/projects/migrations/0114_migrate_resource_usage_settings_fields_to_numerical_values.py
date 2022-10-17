# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0113_refactor_resource_general_usage_setting'),
    ]

    operations = [
        migrations.AlterField(
            model_name='resource',
            name='general_usage_setting',
            field=models.CharField(blank=True, choices=[('1', 'Only selected user groups'), ('2', 'Global')], default=None, max_length=3, null=True, verbose_name='General usage setting for this resource'),
        ),
    ]
