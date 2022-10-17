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

import eric.base64_image_extraction.models.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ExtractedImage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('secret', models.UUIDField(default=uuid.uuid4, editable=False)),
                ('image', models.ImageField(max_length=512, upload_to=eric.base64_image_extraction.models.models.UploadToPathAndRename('extracted_images'), verbose_name='Extracted image')),
                ('source_field', models.CharField(max_length=128, verbose_name='Model field the image was extracted from')),
                ('created_at', models.DateTimeField(auto_now=True)),
                ('object_id', models.UUIDField()),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='extracted_images', to='contenttypes.ContentType')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='extracted_images', to=settings.AUTH_USER_MODEL, verbose_name='Who extracted this element')),
            ],
            options={
                'verbose_name_plural': 'Extracted Images',
                'verbose_name': 'Extracted Image',
            },
        ),
    ]
