# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0017_file_make_title_required'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='labels',
            field=models.ManyToManyField(blank=True, related_name='labels', to='shared_elements.ElementLabel', verbose_name='Which labels are assigned to this task'),
        ),
        migrations.AlterField(
            model_name='task',
            name='projects',
            field=models.ManyToManyField(blank=True, related_name='tasks', to='projects.Project', verbose_name='Which projects is this task associated to'),
        ),
    ]
