# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('drives', '0005_delete_cascade'),
        ('shared_elements', '0005_add_user_storage_limit_check'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='directory',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='drives.Directory', verbose_name='Directory of a Drive where the file is stored at'),
        ),
    ]
