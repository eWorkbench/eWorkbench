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
        ('dmp', '0004_dmpformfield_alter_infotext'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dmpformdata',
            name='dmp',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dmp_form_data', to='dmp.Dmp', verbose_name='Which dmp is this dmp form data associated to'),
        ),
    ]
