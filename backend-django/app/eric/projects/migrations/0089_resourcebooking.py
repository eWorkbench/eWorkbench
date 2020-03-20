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
import django_userforeignkey.models.fields
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('shared_elements', '0013_add_meeting_location'),
        ('projects', '0088_resources_meta_changes'),
    ]

    operations = [
        migrations.CreateModel(
            name='ResourceBooking',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date_time_start', models.DateTimeField(verbose_name='Booking start date and time')),
                ('date_time_end', models.DateTimeField(verbose_name='Booking end date and time')),
                ('comment', models.TextField(blank=True, default='', verbose_name='Booking comment')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resourcebooking_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resourcebooking_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('meeting', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resource_bookings', to='shared_elements.Meeting', verbose_name='Meeting the resource is booked for')),
                ('resource', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='projects.Resource', verbose_name='Booked resource')),
            ],
            options={
                'verbose_name': 'Resource booking',
                'verbose_name_plural': 'Resource bookings',
                'permissions': (('create_resourcebooking', 'Can create a resourcebooking'), ('view_resourcebooking', 'Can view a resourcebooking'), ('edit_resourcebooking', 'Can edit a resourcebooking'), ('change_resourcebooking_meeting', 'Can edit the meeting of a resourcebooking')),
                'ordering': ['-last_modified_at', '-created_at', '-date_time_start'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
    ]
