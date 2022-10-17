# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0021_meeting_date_time_start'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='resource',
            options={'permissions': (('view_resource', 'Can view details of a resource'),), 'verbose_name': 'Resource', 'verbose_name_plural': 'Resources'},
        ),
    ]
