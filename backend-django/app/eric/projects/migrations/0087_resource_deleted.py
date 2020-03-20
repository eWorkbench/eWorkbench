# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0086_remove_uuid_null'),
    ]

    operations = [
        migrations.AddField(
            model_name='resource',
            name='deleted',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not'),
        ),
    ]
