# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('drives', '0004_observer_add_drive_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='directory',
            name='parent_directory',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sub_directories', to='drives.Directory', verbose_name='Parent Directory'),
        ),
    ]
