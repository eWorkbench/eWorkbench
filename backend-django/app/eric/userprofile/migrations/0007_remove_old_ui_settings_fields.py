# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0006_migrate_ui_settings'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='confirm_dialog_settings',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='dynamic_table_settings',
        ),
    ]
