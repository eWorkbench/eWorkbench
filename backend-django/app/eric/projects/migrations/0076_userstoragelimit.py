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
import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0075_changesets'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserStorageLimit',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('storage_megabyte', models.IntegerField(verbose_name='Maximum available storage in megabyte')),
                ('comment', models.TextField(blank=True, verbose_name='Comment about the storage limit')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='userstoragelimit_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='userstoragelimit_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='user_storage_limit', to='projects.MyUser', verbose_name='How many storage can the user maximal use')),
            ],
            options={
                'verbose_name': 'UserStorageLimit',
                'verbose_name_plural': 'UserStorageLimits',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
    ]
