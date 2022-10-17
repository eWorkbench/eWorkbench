# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0077_remove_project_state_deleted'),
    ]

    operations = [
        migrations.RunSQL(
            sql=r'CREATE INDEX "auth_user_username_uppercase" ON "auth_user" (UPPER("username"));',
            reverse_sql=r'DROP INDEX "auth_user_username_uppercase";'
        ),
    ]
