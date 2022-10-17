# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0033_task_db_indexes_and_start_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='start_date',
            field=models.DateTimeField(db_index=True, verbose_name='Task start date'),
        ),
    ]
