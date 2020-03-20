# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0030_meeting_resource'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='state',
            field=models.CharField(choices=[('NEW', 'New'), ('PROG', 'In Progress'), ('FIN', 'Finished'), ('TEST', 'Test'), ('CLOSE', 'Closed')], default='NEW', max_length=5, verbose_name='State of the task'),
        ),
    ]
