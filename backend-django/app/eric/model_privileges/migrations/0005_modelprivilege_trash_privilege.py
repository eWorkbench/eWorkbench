# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('model_privileges', '0004_remove_old_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='modelprivilege',
            name='trash_privilege',
            field=models.CharField(choices=[('AL', 'Allow'), ('DE', 'Deny'), ('NE', 'Neutral')], db_index=True, default='NE', max_length=2, verbose_name='Whether the user is allowed or not allowed to trash this entity'),
        ),
    ]
