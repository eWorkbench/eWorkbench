# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0031_elementlabel_new_regex_validator_patter_for_color_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='full_day',
            field=models.BooleanField(db_index=True, default=False, verbose_name='full day'),
        ),
        migrations.AddField(
            model_name='task',
            name='full_day',
            field=models.BooleanField(db_index=True, default=False, verbose_name='full day'),
        ),
    ]
