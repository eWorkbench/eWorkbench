# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('drives', '0005_delete_cascade'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='directory',
            options={'ordering': ('title',), 'verbose_name': 'Directory', 'verbose_name_plural': 'Directories'},
        ),
    ]
