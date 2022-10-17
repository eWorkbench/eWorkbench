# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations

import django_cleanhtmlfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('kanban_boards', '0018_kanbanboarduserfiltersetting'),
    ]

    operations = [
        migrations.AddField(
            model_name='kanbanboard',
            name='description',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Description of the Kanban Board'),
        ),
    ]
