# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_changeset.models.mixins
import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('shared_elements', '0009_contact_academic_title'),
    ]

    operations = [
        migrations.CreateModel(
            name='ElementLabel',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=128, verbose_name='Title of the meeting')),
                ('color', models.CharField(default='rgba(255,255,255,1)', max_length=30, validators=[django.core.validators.RegexValidator('^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*(\\d+(?:\\.\\d+)?))?\\)$', 'Not a valid RGBA color')], verbose_name='RGBA color the label')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='elementlabel_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='elementlabel_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
            ],
            options={
                'verbose_name': 'Element Label',
                'verbose_name_plural': 'Element Labels',
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
        migrations.AddField(
            model_name='task',
            name='labels',
            field=models.ManyToManyField(related_name='labels', to='shared_elements.ElementLabel', verbose_name='Which labels are assigned to this task'),
        ),
    ]
