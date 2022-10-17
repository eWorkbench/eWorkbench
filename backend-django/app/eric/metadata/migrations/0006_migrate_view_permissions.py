# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('metadata', '0005_add_selection_field'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='metadata',
            options={'ordering': ['created_at']},
        ),
        migrations.AlterField(
            model_name='metadatafield',
            name='type_settings',
            field=django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=dict, verbose_name='Values for base type settings'),
        ),
    ]
