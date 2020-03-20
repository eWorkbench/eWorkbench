# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('metadata', '0003_add_checkbox_field'),
    ]

    operations = [
        migrations.AlterField(
            model_name='metadatafield',
            name='base_type',
            field=models.CharField(choices=[('whole_number', 'Integer'), ('decimal_number', 'Decimal number'), ('currency', 'Currency'), ('date', 'Date'), ('time', 'Time'), ('percentage', 'Percentage'), ('text', 'Text'), ('fraction', 'Fraction'), ('gps', 'GPS'), ('checkbox', 'Checkbox')], max_length=32, verbose_name='Metadata base type'),
        ),
    ]
