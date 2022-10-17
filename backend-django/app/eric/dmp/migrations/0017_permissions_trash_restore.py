# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dmp', '0016_dmp_deleted'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='dmp',
            options={'ordering': ['title', 'status'], 'permissions': (('view_dmp', 'Can view a dmp of a project'), ('trash_dmp', 'Can trash a dmp'), ('restore_dmp', 'Can restore a dmp'), ('add_dmp_without_project', 'Can add a dmp without a project')), 'verbose_name': 'DMP', 'verbose_name_plural': 'DMPs'},
        ),
    ]
