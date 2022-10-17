# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dmp', '0002_dmp_create_all_models'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='dmpformfield',
            options={'ordering': ['ordering', 'name', 'type'], 'verbose_name': 'DMP Form Field', 'verbose_name_plural': 'DMP Form Fields'},
        ),
        migrations.AddField(
            model_name='dmpformfield',
            name='ordering',
            field=models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering'),
        ),
    ]
