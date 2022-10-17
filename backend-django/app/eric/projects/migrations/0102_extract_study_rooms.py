# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0101_user_ordering'),
        ('resources', '0001_add_study_room_model'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='resource',
            name='branch_library',
        ),
        migrations.RemoveField(
            model_name='resource',
            name='study_room',
        ),
    ]
