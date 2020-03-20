# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0008_create_userprofile_first_name_and_last_name_index'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='anonymized',
            field=models.BooleanField(default=False, verbose_name='Anonymized User'),
        ),
    ]
