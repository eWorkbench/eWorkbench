# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import ckeditor.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dmp', '0003_dmpformfield_ordering'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dmpformfield',
            name='infotext',
            field=ckeditor.fields.RichTextField(verbose_name='infotext of the dmp form field'),
        ),
    ]
