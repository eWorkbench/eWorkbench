# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
        ('projects', '0092_resource_update_user_availability_choice_text'),
    ]

    operations = [
        migrations.AddField(
            model_name='resource',
            name='user_availability_selected_user_groups',
            field=models.ManyToManyField(blank=True, related_name='resources', to='auth.Group', verbose_name='The selected user groups this resource is available for'),
        ),
    ]
