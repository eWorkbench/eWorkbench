# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0038_task_reminders'),
    ]

    operations = [
        migrations.AlterField(
            model_name='elementlabel',
            name='color',
            field=models.CharField(default='rgba(255,255,255,1)', max_length=30, validators=[django.core.validators.RegexValidator('(?:rgb\\(\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*\\)|rgba\\(\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*([01]|[01]?\\.\\d+)\\s*\\))', 'Not a valid RGBA color')], verbose_name='RGBA color the label'),
        ),
    ]
