# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
from eric.projects.models.models import FileSystemStorageLimitByUser


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0013_add_meeting_location'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='mime_type',
            field=models.CharField(default='application/octet-stream', max_length=255, verbose_name='Mime type of the uploaded file'),
        ),
        migrations.AlterField(
            model_name='file',
            name='name',
            field=models.CharField(max_length=255, verbose_name='Name of the file'),
        ),
        migrations.AlterField(
            model_name='file',
            name='original_filename',
            field=models.CharField(max_length=255, verbose_name='Original name of the file'),
        ),
        migrations.AlterField(
            model_name='file',
            name='path',
            field=models.FileField(max_length=4096, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='Path of the file'),
        ),
        migrations.AlterField(
            model_name='uploadedfileentry',
            name='mime_type',
            field=models.CharField(default='application/octet-stream', max_length=255, verbose_name='Mime type of the uploaded file'),
        ),
        migrations.AlterField(
            model_name='uploadedfileentry',
            name='original_filename',
            field=models.CharField(max_length=255, verbose_name='Original name of the file'),
        ),
        migrations.AlterField(
            model_name='uploadedfileentry',
            name='path',
            field=models.FileField(max_length=4096, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='Path of the file'),
        ),
    ]
