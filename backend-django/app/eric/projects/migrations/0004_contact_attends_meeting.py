# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django_changeset.models.mixins
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0003_user_attends_meeting'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContactAttendsMeeting',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('contact', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meetings', to='projects.Contact', verbose_name='Attending Contact')),
                ('meeting', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contacts', to='projects.Meeting', verbose_name='Attending Meeting')),
            ],
            options={
                'ordering': ['contact', 'meeting'],
                'verbose_name_plural': 'Contact Meeting Attendances',
                'permissions': (('view_contact_attends_meeting', 'todo'),),
                'verbose_name': 'Contact Meeting Attendance',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
    ]
