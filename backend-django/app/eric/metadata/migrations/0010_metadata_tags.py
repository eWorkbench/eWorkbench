# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('metadata', '0009_json_field_type_for_values'),
    ]

    operations = [
        migrations.CreateModel(
            name='MetadataTag',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=128, unique=True, verbose_name='Tag name')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.AlterField(
            model_name='metadatafield',
            name='base_type',
            field=models.CharField(choices=[('whole_number', 'Integer'), ('decimal_number', 'Decimal number'), ('currency', 'Currency'), ('date', 'Date'), ('real_date', 'Real Date'), ('time', 'Time'), ('percentage', 'Percentage'), ('text', 'Text'), ('fraction', 'Fraction'), ('gps', 'GPS'), ('checkbox', 'Checkbox'), ('selection', 'Selection'), ('tag', 'Tag')], max_length=32, verbose_name='Metadata base type'),
        ),
    ]
