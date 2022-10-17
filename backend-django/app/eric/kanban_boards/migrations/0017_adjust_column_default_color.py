# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0016_new_regex_validator_patter_for_color_field'),
    ]

    operations = [
        migrations.AlterField(
            model_name='kanbanboardcolumn',
            name='color',
            field=models.CharField(default='rgba(244,244,244,1)', max_length=30, validators=[django.core.validators.RegexValidator('(?:rgb\\(\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*\\)|rgba\\(\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*([01]|0?\\.\\d+)\\s*\\))', 'Not a valid RGBA color')], verbose_name='RGBA color of the column'),
        ),
    ]
