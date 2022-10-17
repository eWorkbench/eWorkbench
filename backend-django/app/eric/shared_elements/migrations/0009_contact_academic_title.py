# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0008_file_sortorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='contact',
            name='academic_title',
            field=models.CharField(blank=True, default='', max_length=128, verbose_name='Academic title of the contact'),
        ),
        migrations.AlterField(
            model_name='contact',
            name='email',
            field=models.EmailField(blank=True, max_length=254, verbose_name='Email of the contact'),
        ),
    ]
