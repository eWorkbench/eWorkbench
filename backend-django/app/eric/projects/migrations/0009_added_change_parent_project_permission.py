# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0008_renamed_permissions'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='project',
            options={'ordering': ['project_state'], 'permissions': (('view_project', 'Can view project'), ('change_parent_project', 'Can change the parent project property')), 'verbose_name': 'Project', 'verbose_name_plural': 'Projects'},
        ),
    ]
