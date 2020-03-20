# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals


from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0078_create_user_uppercase_index'),
    ]

    operations = [
        migrations.RunSQL(
            sql=r'CREATE INDEX "auth_user_email_uppercase" ON "auth_user" (UPPER("email"));',
            reverse_sql=r'DROP INDEX "auth_user_email_uppercase";'
        ),
    ]
