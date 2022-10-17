# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0010_element_labels'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='elementlabel',
            options={'ordering': ('name',), 'verbose_name': 'Element Label', 'verbose_name_plural': 'Element Labels'},
        ),
        migrations.AlterField(
            model_name='elementlabel',
            name='name',
            field=models.CharField(blank=True, default='', max_length=128, verbose_name='Title of the meeting'),
        ),
    ]
