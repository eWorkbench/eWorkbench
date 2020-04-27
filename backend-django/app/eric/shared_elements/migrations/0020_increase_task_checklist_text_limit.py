# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0019_tasks_alter_related_name_of_labels_to_tasks'),
    ]

    operations = [
        migrations.AlterField(
            model_name='taskchecklist',
            name='title',
            field=models.CharField(max_length=2000, verbose_name='Title of the checklist item'),
        ),
    ]
