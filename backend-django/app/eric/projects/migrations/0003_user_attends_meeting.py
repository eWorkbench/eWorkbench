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
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0002_add_versionnumber'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserAttendsMeeting',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('meeting', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='users', to='projects.Meeting', verbose_name='Attending Meeting')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meetings', to=settings.AUTH_USER_MODEL, verbose_name='Attending User')),
            ],
            options={
                'permissions': (('view_user_attends_meeting', 'todo'),),
                'verbose_name_plural': 'User Meeting Attendances',
                'verbose_name': 'User Meeting Attendance',
                'ordering': ['user', 'meeting'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
    ]
