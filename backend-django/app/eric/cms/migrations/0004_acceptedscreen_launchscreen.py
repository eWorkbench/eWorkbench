# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import ckeditor_uploader.fields
import django_changeset.models.mixins
import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('cms', '0003_add_footer_pages'),
    ]

    operations = [
        migrations.CreateModel(
            name='LaunchScreen',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('ordering', models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('show_screen', models.BooleanField(db_index=True, default=False, verbose_name='Whether this screen should be shown')),
                ('version', models.CharField(max_length=16, verbose_name='Version')),
                ('title', models.CharField(db_index=True, max_length=128, verbose_name='Title of the launch screen')),
                ('text', ckeditor_uploader.fields.RichTextUploadingField(blank=True, verbose_name='Actual text')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='launchscreen_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='launchscreen_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
            ],
            options={
                'verbose_name': 'Launch screen',
                'verbose_name_plural': 'Launch screens',
                'ordering': ('ordering',),
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='AcceptedScreen',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('accepted_version', models.CharField(max_length=16, verbose_name='Version of the launch screen which has been accepted by the user')),
                ('accepted_timestamp', models.DateTimeField(verbose_name='Last modified date of the launch screen which has been accepted by the user')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='acceptedscreen_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='acceptedscreen_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('launch_screen', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cms.launchscreen', verbose_name='The launch screen which has been accepted by the user')),
                ('user', django_userforeignkey.models.fields.UserForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='The user that accepted the launch screen')),
            ],
            options={
                'verbose_name': 'Accepted screen',
                'verbose_name_plural': 'Accepted screens',
            },
        ),
    ]
