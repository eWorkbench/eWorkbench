# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0008_changesets'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='kanbanboardcolumntaskassignment',
            options={'ordering': ['kanban_board_column__ordering', 'ordering'], 'verbose_name': 'Kanban Board Column', 'verbose_name_plural': 'Kanban Board Columns'},
        ),
    ]
