# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations
import django_cleanhtmlfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('labbooks', '0007_changesets'),
    ]

    operations = [
        migrations.AddField(
            model_name='labbook',
            name='description',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Description of the labbook'),
        ),
    ]
