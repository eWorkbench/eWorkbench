# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dmp', '0015_remove_dmp_project'),
    ]

    operations = [
        migrations.AddField(
            model_name='dmp',
            name='deleted',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not'),
        ),
    ]
