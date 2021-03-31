#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0015_index_title'),
    ]

    operations = [
        migrations.AlterField(
            model_name='kanbanboard',
            name='background_color',
            field=models.CharField(blank=True, max_length=30, null=True, validators=[django.core.validators.RegexValidator('(?:rgb\\(\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*\\)|rgba\\(\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*([01]|0?\\.\\d+)\\s*\\))', 'Not a valid RGBA color')], verbose_name='RGBA color of the board'),
        ),
        migrations.AlterField(
            model_name='kanbanboardcolumn',
            name='color',
            field=models.CharField(default='rgba(255,255,255,1)', max_length=30, validators=[django.core.validators.RegexValidator('(?:rgb\\(\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*\\)|rgba\\(\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|2[0-5]{2})\\s*,\\s*([01]|0?\\.\\d+)\\s*\\))', 'Not a valid RGBA color')], verbose_name='RGBA color of the column'),
        ),
    ]
