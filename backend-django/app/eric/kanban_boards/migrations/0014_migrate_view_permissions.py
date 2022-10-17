# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0013_add_bg_color'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='kanbanboard',
            options={'ordering': ['title'], 'permissions': (('trash_kanbanboard', 'Can trash a Kanban Board'), ('restore_kanbanboard', 'Can restore a Kanban Board'), ('change_project_kanbanboard', 'Can change the project of a Kanban Board'), ('add_kanbanboard_without_project', 'Can add a Kanban Board without a project')), 'verbose_name': 'Kanban Board', 'verbose_name_plural': 'Kanban Boards'},
        ),
    ]
