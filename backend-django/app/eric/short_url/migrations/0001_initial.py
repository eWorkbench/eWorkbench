# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_userforeignkey.models.fields
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ShortURL',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='When was this url created')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='Special primary key of the short url')),
                ('url', models.TextField(verbose_name='The URL that we redirect to')),
                ('last_accessed', models.DateTimeField(auto_now=True, verbose_name='Last time this url was accessed')),
                ('access_count', models.BigIntegerField(default=0, verbose_name='How often this url was accessed')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='The user that created the short url')),
            ],
            options={
                'verbose_name_plural': 'Short URLs',
                'verbose_name': 'Short URL',
            },
        ),
    ]
