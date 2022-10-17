# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0010_migrate_view_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='additional_information',
            field=models.TextField(blank=True, verbose_name='Additional information about the user'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='first_name',
            field=models.CharField(blank=True, max_length=128, verbose_name='First name'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='last_name',
            field=models.CharField(blank=True, max_length=128, verbose_name='Last name'),
        ),
    ]
