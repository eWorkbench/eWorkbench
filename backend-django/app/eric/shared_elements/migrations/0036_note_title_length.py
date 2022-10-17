# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0035_comment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='note',
            name='subject',
            field=models.TextField(db_index=True, verbose_name='Subject of the note'),
        ),
    ]
