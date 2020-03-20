# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0002_ldap_userprofile_maxlength'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='confirm_dialog_settings',
            field=django.contrib.postgres.fields.jsonb.JSONField(blank=True, null=True, verbose_name='Confirm-Dialog settings'),
        ),
    ]
