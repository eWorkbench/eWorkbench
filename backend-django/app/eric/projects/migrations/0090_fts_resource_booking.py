# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.postgres.search
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0089_resourcebooking'),
    ]

    operations = [
        migrations.AddField(
            model_name='resourcebooking',
            name='fts_index',
            field=django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index'),
        ),
        migrations.AddField(
            model_name='resourcebooking',
            name='fts_language',
            field=models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language'),
        ),
    ]
