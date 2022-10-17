# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0020_increase_task_checklist_text_limit'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='taskchecklist',
            options={'ordering': ['task__task_id', 'created_at'], 'verbose_name': 'Task Checklist Item', 'verbose_name_plural': 'Task Checklist Items'},
        ),
    ]
