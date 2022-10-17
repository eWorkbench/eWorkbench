# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0029_alter_file_path'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='imported',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry was imported by a dss import task or not'),
        ),
    ]
