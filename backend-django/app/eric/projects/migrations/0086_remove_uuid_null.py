# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0085_populate_uuid_values_and_rename_type_device'),
    ]

    operations = [
        migrations.AlterField(
            model_name='resource',
            name='inventory_number',
            field=models.CharField(default=uuid.uuid4, max_length=64, unique=True,
                                   verbose_name='Inventory number of the resource'),
        ),
    ]
