# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0018_tasks_auto_id_state_priority'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='project',
            options={'ordering': ['name', 'start_date', 'project_state'], 'permissions': (('view_project', 'Can view project'), ('change_parent_project', 'Can change the parent project property')), 'verbose_name': 'Project', 'verbose_name_plural': 'Projects'},
        ),
        migrations.AlterModelOptions(
            name='task',
            options={'ordering': ['task_id', 'title', 'priority', 'due_date', 'state'], 'permissions': (('view_task', 'Can view a task of a project'), ('task_change_project', 'Can change the project of a task'), ('change_task_state', 'Can change the task state')), 'verbose_name': 'Task', 'verbose_name_plural': 'Tasks'},
        ),
    ]
