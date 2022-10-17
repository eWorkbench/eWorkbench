# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models

from eric.projects.models.models import FileSystemStorageLimitByUser


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0004_changesets'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='path',
            field=models.FileField(max_length=512, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='Path of the file'),
        ),
        migrations.AlterField(
            model_name='uploadedfileentry',
            name='path',
            field=models.FileField(max_length=512, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='Path of the file'),
        ),
    ]
