# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0027_file_history'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='contactattendsmeeting',
            options={'ordering': ['contact', 'meeting'], 'permissions': (('view_contactattendsmeeting', 'Can view contacts that attend a meeting'),), 'verbose_name': 'Contact Meeting Attendance', 'verbose_name_plural': 'Contact Meeting Attendances'},
        ),
        migrations.AlterModelOptions(
            name='userattendsmeeting',
            options={'ordering': ['user', 'meeting'], 'permissions': (('view_userattendsmeeting', 'Can view users that attend a meeting'),), 'verbose_name': 'User Meeting Attendance', 'verbose_name_plural': 'User Meeting Attendances'},
        ),
    ]
