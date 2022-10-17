# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0014_migrate_view_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='kanbanboard',
            name='title',
            field=models.CharField(db_index=True, max_length=128, verbose_name='Title of the Kanban Board'),
        ),
    ]
