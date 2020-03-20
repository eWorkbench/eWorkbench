# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0010_added_project_role_user_assignment_permission'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='project_state',
            field=models.CharField(choices=[('INIT', 'Initialized'), ('START', 'Started'), ('PAUSE', 'Paused'), ('FIN', 'Finished'), ('CANCE', 'Cancelled'), ('DEL', 'Deleted')], default='INIT', max_length=5, verbose_name='State of the Project'),
        ),
    ]
