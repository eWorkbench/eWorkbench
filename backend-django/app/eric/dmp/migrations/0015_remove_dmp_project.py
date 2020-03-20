# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dmp', '0014_convert_foreignkey_to_manytomany'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dmp',
            name='project',
        ),
    ]
