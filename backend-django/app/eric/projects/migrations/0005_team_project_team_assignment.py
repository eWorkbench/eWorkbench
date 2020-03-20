# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_changeset.models.mixins
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0004_contact_attends_meeting'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectTeamAssignment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_teams', to='projects.Project', verbose_name='Assigned Project')),
            ],
            options={
                'verbose_name_plural': 'Project Team Assignments',
                'verbose_name': 'Project Team Assignment',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.CreateModel(
            name='Team',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=256, verbose_name='Name of the team')),
            ],
            options={
                'verbose_name_plural': 'Teams',
                'permissions': (('view_team', 'todo'),),
                'ordering': ['name'],
                'verbose_name': 'Team',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.AlterField(
            model_name='contactattendsmeeting',
            name='contact',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attending_meetings', to='projects.Contact', verbose_name='Attending Contact'),
        ),
        migrations.AlterField(
            model_name='contactattendsmeeting',
            name='meeting',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attending_contacts', to='projects.Meeting', verbose_name='Attending Meeting'),
        ),
        migrations.AlterField(
            model_name='userattendsmeeting',
            name='meeting',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attending_users', to='projects.Meeting', verbose_name='Attending Meeting'),
        ),
        migrations.AlterField(
            model_name='userattendsmeeting',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attending_meetings', to=settings.AUTH_USER_MODEL, verbose_name='Attending User'),
        ),
        migrations.AddField(
            model_name='projectteamassignment',
            name='team',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_projects', to='projects.Team', verbose_name='Assigned Team'),
        ),
    ]
