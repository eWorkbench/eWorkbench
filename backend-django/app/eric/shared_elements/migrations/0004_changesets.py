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


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('shared_elements', '0003_task_state_change'),
    ]

    operations = [
        migrations.AddField(
            model_name='contact',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='contact',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='contact_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='contact',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='contact',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='contact_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='contactattendsmeeting',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='contactattendsmeeting',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='contactattendsmeeting_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='contactattendsmeeting',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='contactattendsmeeting',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='contactattendsmeeting_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='file',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='file',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='file_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='file',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='file',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='file_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='meeting_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='meeting_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='note',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='note',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='note_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='note',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='note',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='note_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='task',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='task',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='task_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='task',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='task',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='task_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='taskassigneduser',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='taskassigneduser',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='taskassigneduser_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='taskassigneduser',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='taskassigneduser',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='taskassigneduser_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='taskchecklist',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='taskchecklist',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='taskchecklist_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='taskchecklist',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='taskchecklist',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='taskchecklist_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='uploadedfileentry',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='uploadedfileentry',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='uploadedfileentry_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='uploadedfileentry',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='uploadedfileentry',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploadedfileentry_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='userattendsmeeting',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='userattendsmeeting',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='userattendsmeeting_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='userattendsmeeting',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='userattendsmeeting',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='userattendsmeeting_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
    ]
