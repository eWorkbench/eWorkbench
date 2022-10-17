# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0021_task_board_columns_rgba_regex'),
    ]

    operations = [
        migrations.AlterField(
            model_name='kanbanboarduserfiltersetting',
            name='settings',
            field=models.JSONField(blank=True, null=True, verbose_name='Kanban Board User Filter Settings'),
        ),
    ]
