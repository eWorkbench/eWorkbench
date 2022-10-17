# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0007_remove_old_ui_settings_fields'),
    ]

    operations = [
        migrations.RunSQL(
            sql=r'CREATE INDEX "userprofile_first_name_uppercase" ON "userprofile_userprofile" (UPPER("first_name"));',
            reverse_sql=r'DROP INDEX "userprofile_first_name_uppercase";'
        ),
        migrations.RunSQL(
            sql=r'CREATE INDEX "userprofile_last_name_uppercase" ON "userprofile_userprofile" (UPPER("last_name"));',
            reverse_sql=r'DROP INDEX "userprofile_last_name_uppercase";'
        ),
    ]
