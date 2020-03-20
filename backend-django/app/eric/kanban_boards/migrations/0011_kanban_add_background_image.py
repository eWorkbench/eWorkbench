# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
from eric.projects.models.models import FileSystemStorageLimitByUser


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0010_kanban_task_state_icon'),
    ]

    operations = [
        migrations.AddField(
            model_name='kanbanboard',
            name='background_image',
            field=models.ImageField(blank=True, max_length=512, null=True, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='The background image of the Kanban Board'),
        ),
        migrations.AddField(
            model_name='kanbanboard',
            name='background_image_size',
            field=models.BigIntegerField(default=0, verbose_name='Size of the background image'),
        ),
    ]
