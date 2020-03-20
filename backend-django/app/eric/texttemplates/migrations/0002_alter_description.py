# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('texttemplates', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='texttemplate',
            options={'ordering': ['name'], 'permissions': (('view_texttemplate', 'Can view text templates'),), 'verbose_name': 'Text Template', 'verbose_name_plural': 'Text Templates'},
        ),
        migrations.AlterField(
            model_name='texttemplate',
            name='content',
            field=models.TextField(blank=True, verbose_name='Content of the text template'),
        ),
        migrations.AlterField(
            model_name='texttemplate',
            name='name',
            field=models.CharField(max_length=128, verbose_name='Name of the text template'),
        ),
    ]
