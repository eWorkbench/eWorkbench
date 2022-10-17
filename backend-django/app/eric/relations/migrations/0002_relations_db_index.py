# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('relations', '0001_initial'),
    ]

    operations = [
        migrations.AlterIndexTogether(
            name='relation',
            index_together=set([('right_content_type', 'right_object_id'), ('left_content_type', 'left_object_id')]),
        ),
    ]
