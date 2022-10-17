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
        ('pictures', '0005_changesets'),
    ]

    operations = [
        migrations.AlterField(
            model_name='picture',
            name='background_image',
            field=models.ImageField(blank=True, max_length=512, null=True, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='The background image of the picture'),
        ),
        migrations.AlterField(
            model_name='picture',
            name='rendered_image',
            field=models.ImageField(blank=True, max_length=512, null=True, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='The rendered image of the picture'),
        ),
        migrations.AlterField(
            model_name='picture',
            name='shapes_image',
            field=models.FileField(blank=True, max_length=512, null=True, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='The shapes of the image'),
        ),
    ]
