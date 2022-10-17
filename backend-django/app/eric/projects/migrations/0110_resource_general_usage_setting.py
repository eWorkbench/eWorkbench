# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0109_resourcebookingrulebookablehours_remove_weekday_fields'),
    ]

    operations = [
        migrations.RenameField(
            model_name='resource',
            old_name='user_availability_selected_user_groups',
            new_name='usage_setting_selected_user_groups',
        ),
        migrations.RemoveField(
            model_name='resource',
            name='user_availability_selected_users',
        ),
        migrations.RenameField(
            model_name='resource',
            old_name='user_availability',
            new_name='general_usage_setting',
        ),
    ]
