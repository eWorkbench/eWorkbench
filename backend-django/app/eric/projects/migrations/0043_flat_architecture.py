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
        ('projects', '0042_userprofile_website'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contact',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='contacts', to='projects.Project', verbose_name='Which project is this contact associated to'),
        ),
        migrations.AlterField(
            model_name='file',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='files', to='projects.Project', verbose_name='Which project is this file associated to'),
        ),
        migrations.AlterField(
            model_name='meeting',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='meetings', to='projects.Project', verbose_name='Which project is this meeting associated to'),
        ),
        migrations.AlterField(
            model_name='note',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='projects.Project', verbose_name='Which project is this note associated to'),
        ),
        migrations.AlterField(
            model_name='task',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='projects.Project', verbose_name='Which project is this task associated to'),
        ),
    ]
