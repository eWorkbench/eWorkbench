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

import eric.core.models.abstract
import eric.core.models.base


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0092_resource_update_user_availability_choice_text'),
        ('labbooks', '0008_add_description'),
    ]

    operations = [
        migrations.CreateModel(
            name='LabbookSection',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date', models.DateField(verbose_name='Date of the LabBook section')),
                ('title', models.CharField(max_length=128, verbose_name='Title of the LabBook section')),
                ('child_elements', models.ManyToManyField(blank=True, related_name='labbooksection', to='labbooks.LabBookChildElement', verbose_name='Which LabBookChildElements is this LabBook section associated to')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='labbooksection_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='labbooksection_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('projects', models.ManyToManyField(blank=True, to='projects.Project', verbose_name='Which projects is this LabBook section associated to')),
            ],
            options={
                'verbose_name_plural': 'LabbookSections',
                'ordering': ['date', 'title'],
                'verbose_name': 'LabbookSection',
                'permissions': (('view_labbooksection', 'Can view a LabBook section'), ('trash_labbooksection', 'Can trash a LabBook section'), ('restore_labbooksection', 'Can restore a LabBook section'), ('change_project_labbooksection', 'Can change the project of a LabBook section'), ('add_labbooksection_without_project', 'Can add a LabBook section without a project')),
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, eric.core.models.base.LockMixin, eric.core.models.abstract.WorkbenchEntityMixin, models.Model),
        ),
    ]
