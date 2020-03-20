# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0019_meta_data_ordering'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='date_time_end',
            field=models.DateTimeField(default=datetime.datetime(2016, 12, 12, 11, 54, 11, 543138, tzinfo=utc), verbose_name='Meeting end date time'),
            preserve_default=False,
        ),
    ]
