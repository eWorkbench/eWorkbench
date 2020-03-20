# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0094_migration_merge_resource_user_groups_and_booking_rules'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='resource',
            name='inventory_number',
        ),
    ]
