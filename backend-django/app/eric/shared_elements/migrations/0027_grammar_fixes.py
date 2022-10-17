# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0026_create_calendaraccess_for_each_user_and_give_full_access'),
    ]

    operations = [
        migrations.AlterField(
            model_name='taskassigneduser',
            name='assigned_user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.MyUser', verbose_name='Which user is the task assigned to'),
        ),
        migrations.AlterField(
            model_name='taskassigneduser',
            name='task',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='shared_elements.Task', verbose_name='Which task is the user assigned to'),
        ),
        migrations.AlterField(
            model_name='taskchecklist',
            name='task',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='checklist_items', to='shared_elements.Task', verbose_name='Which task this checklist item belongs to'),
        ),
    ]
