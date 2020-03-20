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

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='TextTemplate',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=128, verbose_name='name of the texttemplate')),
                ('content', models.TextField(blank=True, verbose_name='Content of the texttemplate')),
            ],
            options={
                'verbose_name_plural': 'TextTemplates',
                'ordering': ['name'],
                'verbose_name': 'TextTemplate',
                'permissions': (('view_texttemplate', 'Can add a new text template'),),
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
    ]
