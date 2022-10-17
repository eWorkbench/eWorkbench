# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dmp', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelManagers(
            name='dmp',
            managers=[
            ],
        ),
        migrations.AlterModelManagers(
            name='dmpform',
            managers=[
            ],
        ),
        migrations.AlterModelManagers(
            name='dmpformdata',
            managers=[
            ],
        ),
        migrations.AlterModelManagers(
            name='dmpformfield',
            managers=[
            ],
        ),
    ]
