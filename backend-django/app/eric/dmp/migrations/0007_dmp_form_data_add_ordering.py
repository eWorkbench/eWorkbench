# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dmp', '0006_role_add_dmp_permissions'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='dmpformdata',
            options={'ordering': ['ordering', 'name', 'type'], 'permissions': (('view_dmp_form_data', 'Can view dmp form data of a project'),), 'verbose_name': 'DMP Form Data', 'verbose_name_plural': 'DMP Form Data'},
        ),
        migrations.AddField(
            model_name='dmpformdata',
            name='ordering',
            field=models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering'),
        ),
    ]
