# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('metadata', '0008_add_real_date_base_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='metadata',
            name='values',
            field=models.JSONField(verbose_name='Field values'),
        ),
        migrations.AlterField(
            model_name='metadatafield',
            name='type_settings',
            field=models.JSONField(blank=True, default=dict, verbose_name='Values for base type settings'),
        ),
    ]
