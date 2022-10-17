# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations

import django_cleanhtmlfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0023_migrate_view_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='contact',
            name='notes',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Notes about the contact'),
        ),
    ]
