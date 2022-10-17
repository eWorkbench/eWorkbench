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
        ('dmp', '0008_role_add_dmp_form_data_permission'),
    ]

    operations = [
        migrations.AddField(
            model_name='dmp',
            name='fts_index',
            field=django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index'),
        ),
        migrations.AddField(
            model_name='dmp',
            name='fts_language',
            field=models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language'),
        ),
    ]
