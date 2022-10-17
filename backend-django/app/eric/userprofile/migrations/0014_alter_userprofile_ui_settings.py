# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0013_confirmation_dialog_settings_cleanup'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='ui_settings',
            field=models.JSONField(blank=True, null=True, verbose_name='Persistent UI settings that have no effect on the backend'),
        ),
    ]
