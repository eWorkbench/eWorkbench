# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0022_resource_view_permission'),
    ]

    operations = [
        migrations.AddField(
            model_name='contact',
            name='company',
            field=models.CharField(blank=True, max_length=128, verbose_name='Company of the contact'),
        ),
        migrations.AddField(
            model_name='contact',
            name='phone',
            field=models.CharField(blank=True, max_length=128, verbose_name='Phone number of the contact'),
        ),
        migrations.AlterField(
            model_name='meeting',
            name='date_time_start',
            field=models.DateTimeField(verbose_name='Meeting start date time'),
        ),
    ]
