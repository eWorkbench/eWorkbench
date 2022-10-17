# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0079_create_user_email_uppercase_index'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='userstoragelimit',
            options={'verbose_name': 'User Storage Limit', 'verbose_name_plural': 'User Storage Limits'},
        ),
        migrations.AlterField(
            model_name='userstoragelimit',
            name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='user_storage_limit', to='projects.MyUser', verbose_name='Which user is this storage limit for'),
        ),
    ]
