# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0054_add_create_without_project_permission_to_user_group'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='org_zug_mitarbeiter',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='Which organisation this user belongs to (if the user is an employee)'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='org_zug_student',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='Which organization this user belongs to (if the user is a student)'),
        ),
    ]
