# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0109_resourcebookingrulebookablehours_remove_weekday_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='elementlock',
            name='webdav_lock',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this lock was set while using webdav'),
        ),
    ]
