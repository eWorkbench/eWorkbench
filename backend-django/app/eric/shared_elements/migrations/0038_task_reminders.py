# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0037_task_title_length'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='remind_assignees',
            field=models.BooleanField(db_index=True, default=False, verbose_name='remind assignees'),
        ),
        migrations.AddField(
            model_name='task',
            name='reminder_datetime',
            field=models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Task reminder datetime'),
        ),
    ]
