# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('texttemplates', '0003_changesets'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='texttemplate',
            options={'ordering': ['name'], 'verbose_name': 'Text Template', 'verbose_name_plural': 'Text Templates'},
        ),
    ]
