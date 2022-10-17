# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plugins', '0002_fix_user_fk'),
    ]

    operations = [
        migrations.AddField(
            model_name='plugin',
            name='iframe_height',
            field=models.IntegerField(default=250, verbose_name='Height of the iframe element in pixel'),
        ),
    ]
