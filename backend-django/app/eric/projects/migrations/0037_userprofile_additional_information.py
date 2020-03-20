# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0036_userprofile_firstname_lastname'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='additional_information',
            field=models.TextField(blank=True, verbose_name='Additional informations of the user'),
        ),
    ]
