# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('labbooks', '0011_remove_view_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='labbook',
            name='title',
            field=models.CharField(db_index=True, max_length=128, verbose_name='Title of the labbook'),
        ),
    ]
