# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('metadata', '0006_migrate_view_permissions'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='metadata',
            options={'ordering': ['entity_id', 'ordering', 'created_at']},
        ),
        migrations.AddField(
            model_name='metadata',
            name='ordering',
            field=models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering'),
        ),
    ]
