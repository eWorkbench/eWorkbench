# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0061_convert_foreignkey_to_manytomany'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='contact',
            name='project',
        ),
        migrations.RemoveField(
            model_name='file',
            name='project',
        ),
        migrations.RemoveField(
            model_name='meeting',
            name='project',
        ),
        migrations.RemoveField(
            model_name='note',
            name='project',
        ),
        migrations.RemoveField(
            model_name='task',
            name='project',
        ),
    ]
