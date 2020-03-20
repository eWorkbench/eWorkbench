# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0012_reference_archived_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='location',
            field=models.CharField(blank=True, max_length=128, null=True, verbose_name='Where the meeting takes place'),
        ),
    ]
