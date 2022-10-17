# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0009_kanban_board_column_ordering'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='kanbanboardcolumn',
            name='task_state',
        ),
        migrations.AddField(
            model_name='kanbanboardcolumn',
            name='icon',
            field=models.CharField(blank=True, choices=[('fa fa-star', 'New'), ('fa fa-spinner', 'In Progress'), ('fa fa-check', 'Done'), ('fa fa-pause', 'Paused'), ('fa fa-times', 'Canceled'), ('fa fa-book', 'Documentation'), ('fa fa-truck', 'Delivery'), ('fa fa-bars', 'ToDo'), ('fa fa-bolt', 'Testing'), ('fa fa-code-fork', 'Decision required'), ('fa fa-flask', 'Flask'), ('fa fa-question', 'Question')], default='', max_length=64, verbose_name='Icon of kanban board column'),
        ),
    ]
