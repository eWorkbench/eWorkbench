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

from eric.projects.models.models import FileSystemStorageLimitByUser


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('pictures', '0006_add_user_storage_limit_check'),
    ]

    operations = [
        migrations.CreateModel(
            name='UploadedPictureEntry',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('background_image', models.ImageField(blank=True, max_length=512, null=True, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='The background image of the picture')),
                ('background_image_size', models.BigIntegerField(default=0, verbose_name='Size of the background image')),
                ('rendered_image', models.ImageField(blank=True, max_length=512, null=True, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='The rendered image of the picture')),
                ('rendered_image_size', models.BigIntegerField(default=0, verbose_name='Size of the rendered image')),
                ('shapes_image', models.FileField(blank=True, max_length=512, null=True, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='The shapes of the image')),
                ('shapes_image_size', models.BigIntegerField(default=0, verbose_name='Size of the background image')),
                ('width', models.IntegerField(default=512, verbose_name='Width of the picture in pixel')),
                ('height', models.IntegerField(default=512, verbose_name='Height of the picture in pixel')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploadedpictureentry_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploadedpictureentry_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
            ],
            options={
                'ordering': ['picture', 'id'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.AddField(
            model_name='picture',
            name='background_image_size',
            field=models.BigIntegerField(default=0, verbose_name='Size of the background image'),
        ),
        migrations.AddField(
            model_name='picture',
            name='rendered_image_size',
            field=models.BigIntegerField(default=0, verbose_name='Size of the rendered image'),
        ),
        migrations.AddField(
            model_name='picture',
            name='shapes_image_size',
            field=models.BigIntegerField(default=0, verbose_name='Size of the background image'),
        ),
        migrations.AddField(
            model_name='uploadedpictureentry',
            name='picture',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='picture_entries', to='pictures.Picture', verbose_name='Which picture this entry related to'),
        ),
    ]
