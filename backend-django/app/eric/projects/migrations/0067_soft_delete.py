# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0066_task_start_due_date_optional'),
    ]

    operations = [
        migrations.AddField(
            model_name='contact',
            name='deleted',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not'),
        ),
        migrations.AddField(
            model_name='file',
            name='deleted',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='deleted',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not'),
        ),
        migrations.AddField(
            model_name='note',
            name='deleted',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not'),
        ),
        migrations.AddField(
            model_name='project',
            name='deleted',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not'),
        ),
        migrations.AddField(
            model_name='task',
            name='deleted',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not'),
        ),
    ]
