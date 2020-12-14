#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('drives', '0009_migrate_view_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='directory',
            name='imported',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry was imported by a dss import task or not'),
        ),
    ]
