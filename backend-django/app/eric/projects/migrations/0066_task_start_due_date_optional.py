# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0065_user_proxy_model'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='due_date',
            field=models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Task due date'),
        ),
        migrations.AlterField(
            model_name='task',
            name='start_date',
            field=models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Task start date'),
        ),
    ]
