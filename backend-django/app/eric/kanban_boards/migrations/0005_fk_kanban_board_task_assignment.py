# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0004_observer_add_kanban_board_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='kanbanboardcolumntaskassignment',
            name='kanban_board_column',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='kanban_board_column_task_assignments', to='kanban_boards.KanbanBoardColumn'),
        ),
    ]
