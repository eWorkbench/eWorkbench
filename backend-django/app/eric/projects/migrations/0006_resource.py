# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import django_changeset.models.mixins
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0005_team_project_team_assignment'),
    ]

    operations = [
        migrations.CreateModel(
            name='Resource',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=256, verbose_name='Title of the resource')),
                ('type', models.CharField(choices=[('Room', 'Room'), ('Device', 'Device')], default='Room', max_length=20, verbose_name='Type of this resource (e.g., Room, Device)')),
                ('description', models.TextField(blank=True, default='', verbose_name='Description of this resource')),
                ('availability', models.TextField(blank=True, default='', verbose_name='Timeframes when this resource is available (text)')),
                ('address', models.TextField(blank=True, default='', verbose_name='Address of this resource')),
            ],
            options={
                'verbose_name': 'Resource',
                'verbose_name_plural': 'Resources',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
    ]
