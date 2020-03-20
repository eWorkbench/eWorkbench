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

    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Relation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('left_object_id', models.UUIDField(verbose_name='Left object id of the relation')),
                ('right_object_id', models.UUIDField(verbose_name='Right object id of the relation')),
                ('private', models.BooleanField(default=False, verbose_name='Private Field of the relation')),
                ('left_content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='left_content_type', to='contenttypes.ContentType', verbose_name='Left content type of the relation')),
                ('right_content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='right_content_type', to='contenttypes.ContentType', verbose_name='Right content type of the relation')),
            ],
            options={
                'verbose_name': 'Relation',
                'verbose_name_plural': 'Relations',
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
    ]
