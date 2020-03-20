# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion
import eric.core.models.fields
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Version',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('object_id', models.UUIDField()),
                ('metadata', django.contrib.postgres.fields.jsonb.JSONField(blank=True, default='{}', verbose_name='Meta data for this version of the related entity')),
                ('number', eric.core.models.fields.AutoIncrementIntegerWithPrefixField(db_index=True, default=0, editable=False, verbose_name='Version number')),
                ('summary', models.TextField(blank=True, default='', verbose_name='Summary of the version')),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType')),
            ],
            options={
                'verbose_name_plural': 'Versions',
                'verbose_name': 'Version',
            },
        ),
        migrations.AlterUniqueTogether(
            name='version',
            unique_together=set([('content_type', 'object_id', 'number')]),
        ),
    ]
