# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0091_resource_inventory_number_remove_default'),
    ]

    operations = [
        migrations.AlterField(
            model_name='resource',
            name='user_availability',
            field=models.CharField(choices=[('GLB', 'Global'), ('PRJ', 'Only project members'), ('USR', 'Only selected users')], default='GLB', max_length=3, verbose_name='User availability for this resource'),
        ),
    ]
