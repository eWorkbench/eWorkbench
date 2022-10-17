# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations

import eric.dss.models.models
from eric.shared_elements.models.models import DynamicStorageFileField


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0028_add_indexes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='path',
            field=DynamicStorageFileField(blank=True, max_length=4096, null=True, upload_to=eric.dss.models.models.get_upload_to_path, verbose_name='Path of the file'),
        ),
        migrations.AlterField(
            model_name='uploadedfileentry',
            name='path',
            field=DynamicStorageFileField(max_length=4096, upload_to=eric.dss.models.models.get_upload_to_path, verbose_name='Path of the file'),
        ),
    ]
