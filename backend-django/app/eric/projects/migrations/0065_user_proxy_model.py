# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.auth.models
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
        ('projects', '0064_move_model_privileges'),
    ]

    operations = [
        migrations.CreateModel(
            name='MyUser',
            fields=[
            ],
            options={
                'indexes': [],
                'proxy': True,
                'ordering': ('userprofile__last_name',),
            },
            bases=('auth.user',),
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.AlterModelOptions(
            name='contact',
            options={'ordering': ['last_name', 'first_name', 'email'], 'permissions': (('view_contact', 'Can view a contact of a project'), ('change_project_contact', 'Can change the project of a contact'), ('add_contact_without_project', 'Can add a contact without a project')), 'verbose_name': 'Contact', 'verbose_name_plural': 'Contacts'},
        ),
        migrations.AlterField(
            model_name='meeting',
            name='attending_users',
            field=models.ManyToManyField(through='projects.UserAttendsMeeting', to='projects.MyUser'),
        ),
        migrations.AlterField(
            model_name='projectroleuserassignment',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_projects_roles', to='projects.MyUser', verbose_name='Which user is assigned to this project and role'),
        ),
        migrations.AlterField(
            model_name='task',
            name='assigned_users',
            field=models.ManyToManyField(through='projects.TaskAssignedUser', to='projects.MyUser'),
        ),
        migrations.AlterField(
            model_name='taskassigneduser',
            name='assigned_user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.MyUser', verbose_name='Which user is the task is assigned to'),
        ),
        migrations.AlterField(
            model_name='userattendsmeeting',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attending_meetings', to='projects.MyUser', verbose_name='Attending User'),
        ),
    ]
