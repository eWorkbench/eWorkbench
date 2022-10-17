# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0033_meeting_task_full_day_data_migration'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='taskchecklist',
            options={
                'ordering': ['task__task_id', 'ordering', 'created_at'],
                'verbose_name': 'Task Checklist Item', 'verbose_name_plural': 'Task Checklist Items'
            },
        ),
        migrations.AddField(
            model_name='taskchecklist',
            name='ordering',
            field=models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering'),
        ),
    ]
