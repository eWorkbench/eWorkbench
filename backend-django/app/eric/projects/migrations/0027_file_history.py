# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django_changeset.models.mixins
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0026_filefield_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='UploadedFileEntry',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('path', models.FileField(max_length=512, upload_to='', verbose_name='Path of the file')),
                ('mime_type', models.CharField(default='application/octet-stream', max_length=128, verbose_name='Mime type of the uploaded file')),
                ('file_size', models.BigIntegerField(verbose_name='Size of the file')),
                ('original_filename', models.CharField(max_length=128, verbose_name='Original name of the file')),
            ],
            options={
                'ordering': ['path', 'id'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.AddField(
            model_name='file',
            name='file_size',
            field=models.BigIntegerField(default=0, verbose_name='Size of the file'),
        ),
        migrations.AddField(
            model_name='uploadedfileentry',
            name='file',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='file_entries', to='projects.File', verbose_name='Which file is this entry related to'),
        ),
    ]
