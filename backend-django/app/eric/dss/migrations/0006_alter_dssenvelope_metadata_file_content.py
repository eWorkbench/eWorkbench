# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dss', '0005_data_migrate_idtags_out_of_existing_dir_metadata_jsons'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dssenvelope',
            name='metadata_file_content',
            field=models.JSONField(blank=True, verbose_name='The JSON content of the metadata file within this envelope'),
        ),
    ]
