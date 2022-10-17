#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('drives', '0010_directory_imported'),
        ('dss', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='drive',
            name='envelope',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='drives', to='dss.DSSEnvelope', verbose_name='Which DSS Envelope this drive is mapped to'),
        ),
        migrations.AddField(
            model_name='drive',
            name='imported',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry was imported by a dss import task or not'),
        ),
    ]
