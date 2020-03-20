# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0012_kanbanboard_background_image_thumbnail'),
    ]

    operations = [
        migrations.AddField(
            model_name='kanbanboard',
            name='background_color',
            field=models.CharField(blank=True, max_length=30, null=True, validators=[django.core.validators.RegexValidator('^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*(\\d+(?:\\.\\d+)?))?\\)$', 'Not a valid RGBA color')], verbose_name='RGBA color of the board'),
        ),
    ]
