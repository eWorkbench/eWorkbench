# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0029_role_add_pm_meeting_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='resource',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='meetings', to='projects.Resource', verbose_name='Which resource is booked for this meeting'),
        ),
    ]
