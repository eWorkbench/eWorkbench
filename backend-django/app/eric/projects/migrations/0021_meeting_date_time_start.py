# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import datetime

from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0020_meeting_date_time_end'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='meeting',
            options={'ordering': ['title', 'date_time_start', 'date_time_end', 'text'], 'permissions': (('view_meeting', 'Can view a meeting of a project'), ('meeting_change_project', 'Can change the project of a meeting')), 'verbose_name': 'Meeting', 'verbose_name_plural': 'Meetings'},
        ),
        migrations.RenameField(
            model_name='meeting',
            old_name='date_time',
            new_name='date_time_start',
        ),
    ]
