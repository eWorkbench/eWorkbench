# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0102_extract_study_rooms'),
    ]

    operations = [
        migrations.AddField(
            model_name='resourcebookingrulebookablehours',
            name='full_day',
            field=models.BooleanField(db_index=True, default=True, verbose_name='full day'),
        ),
    ]
