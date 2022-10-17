# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('dmp', '0018_changeset'),
    ]

    operations = [
        migrations.AddField(
            model_name='dmpform',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='dmpform',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='dmpform_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='dmpform',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='dmpform',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dmpform_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='dmpformdata',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='dmpformdata',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='dmpformdata_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='dmpformdata',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='dmpformdata',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dmpformdata_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='dmpformfield',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='dmpformfield',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='dmpformfield_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='dmpformfield',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='dmpformfield',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dmpformfield_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
    ]
