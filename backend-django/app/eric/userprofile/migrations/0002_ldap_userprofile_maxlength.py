# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='org_zug_mitarbeiter_lang',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=256), blank=True, default=[], null=True, size=None, verbose_name='org_zug_mitarbeiter_lang'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='org_zug_student_lang',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=256), blank=True, default=[], null=True, size=None, verbose_name='org_zug_student_lang'),
        ),
    ]
