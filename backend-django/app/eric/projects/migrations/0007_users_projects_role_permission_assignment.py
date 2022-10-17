# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_changeset.models.mixins


class Migration(migrations.Migration):
    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
        ('projects', '0006_resource'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectRoleUserAssignment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_users_roles', to='projects.Project', verbose_name='Which project is assigned to this user and role')),
            ],
            options={
                'abstract': False,
                'ordering': ['-pk'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255, verbose_name='Name of the role')),
            ],
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='RolePermissionAssignment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.Permission', verbose_name='The permission which is assigned to this role')),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.Role', verbose_name='The assigned permission is for this role')),
            ],
            options={
                'abstract': False,
                'ordering': ['-pk'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.RemoveField(
            model_name='projectteamassignment',
            name='project',
        ),
        migrations.RemoveField(
            model_name='projectteamassignment',
            name='team',
        ),
        migrations.DeleteModel(
            name='ProjectTeamAssignment',
        ),
        migrations.DeleteModel(
            name='Team',
        ),
        migrations.AddField(
            model_name='role',
            name='permissions',
            field=models.ManyToManyField(blank=True, through='projects.RolePermissionAssignment', to='auth.Permission'),
        ),
        migrations.AddField(
            model_name='projectroleuserassignment',
            name='role',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_users_projects', to='projects.Role', verbose_name='Which role is assigned to this user and project'),
        ),
        migrations.AddField(
            model_name='projectroleuserassignment',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_projects_roles', to=settings.AUTH_USER_MODEL, verbose_name='Which user is assigned to this project and role'),
        ),
        migrations.AlterModelOptions(
            name='projectroleuserassignment',
            options={},
        ),
        migrations.AlterUniqueTogether(
            name='projectroleuserassignment',
            unique_together=set([('user', 'project'), ('user', 'project', 'role')]),
        ),
    ]
