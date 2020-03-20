# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import eric.projects.models.models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0024_fts'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='description',
            field=models.TextField(blank=True, verbose_name='Description of the file'),
        ),
        migrations.AddField(
            model_name='file',
            name='mime_type',
            field=models.CharField(default='application/octet-stream', max_length=128, verbose_name='Mime type of the uploaded file'),
        ),
        migrations.AlterField(
            model_name='file',
            name='path',
            field=models.FileField(upload_to=eric.projects.models.scramble_uploaded_filename, verbose_name='Path of the file'),
        ),
    ]
