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

import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MenuEntry',
            fields=[
                ('ordering', models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering')),
                ('visible', models.BooleanField(db_index=True, default=True, verbose_name='Whether this entry is visible or not')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('route', models.CharField(max_length=128, verbose_name='Route (State) of this menu entry')),
                ('owner', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='User that owns the menu entry')),
            ],
            options={
                'verbose_name': 'Menu Entry',
                'verbose_name_plural': 'Menu Entries',
                'ordering': ('owner', 'ordering', 'route'),
            },
        ),
        migrations.CreateModel(
            name='MenuEntryParameter',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=128, verbose_name='Name of the parameter')),
                ('value', models.CharField(blank=True, max_length=128, verbose_name='Value of the parameter')),
                ('menu_entry', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='menu_entry_parameters', to='sortable_menu.MenuEntry', verbose_name='Which Menu Entry is this parameter associated to')),
            ],
            options={
                'verbose_name': 'Parameter of a Menu Entry',
                'verbose_name_plural': 'Parameters of a Menu Entry',
            },
        ),
    ]
