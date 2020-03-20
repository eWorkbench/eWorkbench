# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0005_fk_kanban_board_task_assignment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='kanbanboardcolumn',
            name='task_state',
            field=models.CharField(choices=[('NEW', 'New'), ('PROG', 'In Progress'), ('DONE', 'Done')], db_index=True,
                                   default='NEW', max_length=5,
                                   verbose_name='Which task state should tasks in this kanban board column be related to'),
        ),
    ]
