# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('versions', '0003_metadata-no-default'),
    ]

    operations = [
        migrations.AlterField(
            model_name='version',
            name='metadata',
            field=models.JSONField(blank=True, verbose_name='Meta data for this version of the related entity'),
        ),
    ]
