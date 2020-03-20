# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('labbooks', '0005_labbook_childelements_ordering'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='labbookchildelement',
            options={'ordering': ('position_y', 'position_x'), 'verbose_name': 'Child element of a labbook', 'verbose_name_plural': 'Child elements of a labbook'},
        ),
        migrations.RemoveField(
            model_name='labbookchildelement',
            name='ordering',
        ),
    ]
