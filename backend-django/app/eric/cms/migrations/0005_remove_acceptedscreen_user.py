# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0004_acceptedscreen_launchscreen'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='acceptedscreen',
            name='user',
        ),
    ]
