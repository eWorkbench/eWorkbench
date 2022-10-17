# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('drives', '0006_directory_ordering'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='directory',
            options={'ordering': ('name',), 'verbose_name': 'Directory', 'verbose_name_plural': 'Directories'},
        ),
        migrations.RenameField(
            model_name='directory',
            old_name='parent_directory',
            new_name='directory',
        ),
        migrations.RenameField(
            model_name='directory',
            old_name='title',
            new_name='name',
        ),
    ]
