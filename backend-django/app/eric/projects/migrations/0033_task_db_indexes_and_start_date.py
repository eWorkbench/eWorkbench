# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0032_change_userprofile_attributes'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='start_date',
            field=models.DateTimeField(db_index=True, default=datetime.datetime.now, verbose_name='Task start date'),
        ),
        migrations.AlterField(
            model_name='task',
            name='due_date',
            field=models.DateTimeField(db_index=True, verbose_name='Task due date'),
        ),
        migrations.AlterField(
            model_name='task',
            name='state',
            field=models.CharField(choices=[('NEW', 'New'), ('PROG', 'In Progress'), ('FIN', 'Finished'), ('TEST', 'Test'), ('CLOSE', 'Closed')], db_index=True, default='NEW', max_length=5, verbose_name='State of the task'),
        ),
    ]
