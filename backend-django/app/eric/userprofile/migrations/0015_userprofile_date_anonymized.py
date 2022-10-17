# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0014_alter_userprofile_ui_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='date_anonymized',
            field=models.DateTimeField(blank=True, default=None, null=True, verbose_name='Date when this user was anonymized'),
        ),
    ]
