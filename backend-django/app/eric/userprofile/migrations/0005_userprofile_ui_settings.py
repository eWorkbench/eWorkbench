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
        ('userprofile', '0004_userprofile_dynamic_table_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='ui_settings',
            field=django.contrib.postgres.fields.jsonb.JSONField(
                blank=True,
                null=True,
                verbose_name='Persistent UI settings that have no effect on the backend'),
        )
    ]
