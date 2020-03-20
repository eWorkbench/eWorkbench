# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0006_task_state_changed'),
    ]

    operations = [
        migrations.AlterField(
            model_name='kanbanboardcolumn',
            name='kanban_board',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='kanban_board_columns', to='kanban_boards.KanbanBoard', verbose_name='Which kanban board is this column assigned to'),
        ),
    ]
