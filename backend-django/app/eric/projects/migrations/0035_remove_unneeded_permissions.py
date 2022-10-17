# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0034_task_change_start_date'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='task',
            options={'ordering': ['task_id', 'title', 'priority', 'due_date', 'state'], 'permissions': (('view_task', 'Can view a task of a project'), ('task_change_project', 'Can change the project of a task')), 'verbose_name': 'Task', 'verbose_name_plural': 'Tasks'},
        ),
    ]
