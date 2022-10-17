# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0057_fill_task_assigned_user'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='task',
            name='assigned_user',
        ),
    ]
