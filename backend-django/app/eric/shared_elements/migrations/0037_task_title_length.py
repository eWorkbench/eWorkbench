# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0036_note_title_length'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='title',
            field=models.TextField(verbose_name='Title of the task'),
        ),
    ]
