# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0025_file_mime_type_description_autosave'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='path',
            field=models.FileField(max_length=512, upload_to='', verbose_name='Path of the file'),
        ),
    ]
