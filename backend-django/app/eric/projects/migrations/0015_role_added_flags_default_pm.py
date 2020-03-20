# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0014_initial_user_group'),
    ]

    operations = [
        migrations.AddField(
            model_name='role',
            name='default_role_on_project_create',
            field=models.BooleanField(default=False, verbose_name='Marks the default role when creating a new project (should be exactly one role)'),
        ),
        migrations.AddField(
            model_name='role',
            name='default_role_on_project_user_assign',
            field=models.BooleanField(default=False, verbose_name='Marks the default role when a new user is assigned to project (should be exactly one role)'),
        ),
    ]
