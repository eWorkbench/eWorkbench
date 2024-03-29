# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0039_labels_rgba_regex'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='priority',
            field=models.CharField(choices=[('1', 'Very High'), ('2', 'High'), ('3', 'Normal'), ('4', 'Low'), ('5', 'Very Low')], default='3', max_length=5, verbose_name='Priority of the task'),
        ),
    ]
