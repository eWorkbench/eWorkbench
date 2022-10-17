# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0027_grammar_fixes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contact',
            name='first_name',
            field=models.CharField(db_index=True, max_length=128, verbose_name='First name of the contact'),
        ),
        migrations.AlterField(
            model_name='meeting',
            name='date_time_end',
            field=models.DateTimeField(db_index=True, verbose_name='Meeting end date time'),
        ),
        migrations.AlterField(
            model_name='meeting',
            name='date_time_start',
            field=models.DateTimeField(db_index=True, verbose_name='Meeting start date time'),
        ),
        migrations.AlterField(
            model_name='note',
            name='subject',
            field=models.CharField(db_index=True, max_length=128, verbose_name='Subject of the note'),
        ),
    ]
