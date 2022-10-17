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
        ('projects', '0059_meeting_attendees_unique'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='contact',
            options={'ordering': ['first_name', 'last_name', 'email'], 'permissions': (('view_contact', 'Can view a contact of a project'), ('change_project_contact', 'Can change the project of a contact'), ('add_contact_without_project', 'Can add a contact without a project')), 'verbose_name': 'Contact', 'verbose_name_plural': 'Contacts'},
        ),
        migrations.AddField(
            model_name='contact',
            name='projects',
            field=models.ManyToManyField(related_name='contacts', to='projects.Project', verbose_name='Which projects is this contact associated to'),
        ),
        migrations.AddField(
            model_name='file',
            name='projects',
            field=models.ManyToManyField(related_name='files', to='projects.Project', verbose_name='Which projects is this file associated to'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='projects',
            field=models.ManyToManyField(related_name='meetings', to='projects.Project', verbose_name='Which projects is this meeting associated to'),
        ),
        migrations.AddField(
            model_name='note',
            name='projects',
            field=models.ManyToManyField(related_name='notes', to='projects.Project', verbose_name='Which projects is this note associated to'),
        ),
        migrations.AddField(
            model_name='task',
            name='projects',
            field=models.ManyToManyField(related_name='tasks', to='projects.Project', verbose_name='Which projects is this task associated to'),
        ),
        migrations.AlterField(
            model_name='contact',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='projects.Project', verbose_name='Which project is this contact associated to'),
        ),
        migrations.AlterField(
            model_name='file',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='projects.Project', verbose_name='Which project is this file associated to'),
        ),
        migrations.AlterField(
            model_name='meeting',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='projects.Project', verbose_name='Which project is this meeting associated to'),
        ),
        migrations.AlterField(
            model_name='note',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='projects.Project', verbose_name='Which project is this note associated to'),
        ),
        migrations.AlterField(
            model_name='task',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='projects.Project', verbose_name='Which project is this task associated to'),
        ),
        migrations.AlterField(
            model_name='contact',
            name='projects',
            field=models.ManyToManyField(blank=True, related_name='contacts', to='projects.Project',
                                         verbose_name='Which projects is this contact associated to'),
        ),
        migrations.AlterField(
            model_name='file',
            name='projects',
            field=models.ManyToManyField(blank=True, related_name='files', to='projects.Project',
                                         verbose_name='Which projects is this file associated to'),
        ),
        migrations.AlterField(
            model_name='meeting',
            name='projects',
            field=models.ManyToManyField(blank=True, related_name='meetings', to='projects.Project',
                                         verbose_name='Which projects is this meeting associated to'),
        ),
        migrations.AlterField(
            model_name='note',
            name='projects',
            field=models.ManyToManyField(blank=True, related_name='notes', to='projects.Project',
                                         verbose_name='Which projects is this note associated to'),
        ),
    ]
