# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0039_add_invite_user_permission_to_user_group'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='storage_space',
            field=models.CharField(default='', max_length=128, verbose_name='Storage space requested for this project'),
        ),
    ]
