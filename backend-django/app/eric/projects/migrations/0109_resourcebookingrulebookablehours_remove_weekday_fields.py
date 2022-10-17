# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0108_resourcebookingrulebookablehours_different_times'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='resourcebookingrulebookablehours',
            name='monday',
        ),
        migrations.RemoveField(
            model_name='resourcebookingrulebookablehours',
            name='tuesday',
        ),
        migrations.RemoveField(
            model_name='resourcebookingrulebookablehours',
            name='wednesday',
        ),
        migrations.RemoveField(
            model_name='resourcebookingrulebookablehours',
            name='thursday',
        ),
        migrations.RemoveField(
            model_name='resourcebookingrulebookablehours',
            name='friday',
        ),
        migrations.RemoveField(
            model_name='resourcebookingrulebookablehours',
            name='saturday',
        ),
        migrations.RemoveField(
            model_name='resourcebookingrulebookablehours',
            name='sunday',
        ),
    ]
