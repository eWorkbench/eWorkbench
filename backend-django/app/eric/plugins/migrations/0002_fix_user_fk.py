# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plugins', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='plugin',
            name='responsible_users',
            field=models.ManyToManyField(to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='plugin',
            name='user_availability',
            field=models.CharField(choices=[('GLB', 'Global'), ('USR', 'Only selected users and groups')], default='GLB', max_length=3, verbose_name='User availability for this plugin'),
        ),
    ]
