# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dss', '0002_add_dss_curator_group_and_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dssfilestoimport',
            name='imported_at',
            field=models.DateTimeField(blank=True, db_index=True, editable=False, null=True, verbose_name='Date when this element was imported'),
        ),
        migrations.AlterField(
            model_name='dssfilestoimport',
            name='last_import_attempt_failed_at',
            field=models.DateTimeField(blank=True, db_index=True, editable=False, null=True, verbose_name='Date of the last failed import attempt of the File to import'),
        ),
    ]
