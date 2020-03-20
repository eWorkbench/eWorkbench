# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0016_file_populate_title_from_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='title',
            field=models.CharField(max_length=255, verbose_name='Title of the file'),
        ),
    ]
