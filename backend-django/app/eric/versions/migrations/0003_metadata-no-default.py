# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('versions', '0002_created-at-by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='version',
            name='metadata',
            field=django.contrib.postgres.fields.jsonb.JSONField(blank=True, verbose_name='Meta data for this version of the related entity'),
        ),
    ]
