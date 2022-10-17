# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0100_add_indexes'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='myuser',
            options={'ordering': ('userprofile__last_name', 'userprofile__first_name', 'email', 'username')},
        ),
    ]
