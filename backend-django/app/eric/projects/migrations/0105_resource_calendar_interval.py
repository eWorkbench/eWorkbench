# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0104_resourcebookingrulebookablehours_full_day_data_migration'),
    ]

    operations = [
        migrations.AddField(
            model_name='resource',
            name='calendar_interval',
            field=models.PositiveSmallIntegerField(blank=True, default=30, validators=[django.core.validators.MaxValueValidator(1440), django.core.validators.MinValueValidator(1)], verbose_name='resource calendar interval in minutes'),
        ),
    ]
