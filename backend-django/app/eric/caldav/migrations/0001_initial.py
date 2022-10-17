# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_userforeignkey.models.fields

import eric.caldav.models.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('shared_elements', '0012_reference_archived_file'),
    ]

    operations = [
        migrations.CreateModel(
            name='CaldavItem',
            fields=[
                ('id', models.CharField(default=eric.caldav.models.models.get_default_caldav_item_uid, max_length=255, primary_key=True, serialize=False, verbose_name='CalDav Item Unique Identifier')),
                ('name', models.CharField(max_length=255, unique=True, verbose_name='Name of the ICAL File')),
                ('text', models.TextField(verbose_name='ICAL File Content')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Creation time of this caldav item')),
                ('last_modified_at', models.DateTimeField(auto_now=True, verbose_name='Last modification time of this caldav item')),
                ('deleted_via_caldav_on', models.DateTimeField(default=None, null=True, verbose_name='Whether this item was deleted via CalDav (and when)')),
                ('deleted_via_caldav_by', django_userforeignkey.models.fields.UserForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='The user that deleted the item via CalDav')),
                ('meeting', models.OneToOneField(null=True, on_delete=django.db.models.deletion.CASCADE, to='shared_elements.Meeting')),
            ],
            options={
                'verbose_name_plural': 'CalDav Items',
                'ordering': ('last_modified_at',),
                'verbose_name': 'CalDav Item',
            },
        ),
    ]
