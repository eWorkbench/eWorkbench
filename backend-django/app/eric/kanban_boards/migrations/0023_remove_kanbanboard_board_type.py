# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0022_alter_kanbanboarduserfiltersetting_settings'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='kanbanboard',
            name='board_type',
        ),
    ]
