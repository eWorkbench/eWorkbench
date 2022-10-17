# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0014_longer_file_names'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='title',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Title of the file'),
        ),
        migrations.AlterField(
            model_name='file',
            name='name',
            field=models.CharField(max_length=255, verbose_name='Current name of the file'),
        ),
    ]
