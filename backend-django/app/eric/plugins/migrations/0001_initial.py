# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

import django.contrib.postgres.search
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import ckeditor.fields
import django_changeset.models.mixins
import django_userforeignkey.models.fields

import eric.core.models.abstract
import eric.core.models.base


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0099_migrate_view_permissions'),
        ('auth', '0011_update_proxy_permissions'),
    ]

    operations = [
        migrations.CreateModel(
            name='Plugin',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the plugin')),
                ('short_description', models.CharField(max_length=256, verbose_name='Short description of the plugin')),
                ('long_description', ckeditor.fields.RichTextField(blank=True, verbose_name='Long description of the plugin')),
                ('notes', ckeditor.fields.RichTextField(blank=True, verbose_name='Notes on this plugin (Only viewable in administration interface)')),
                ('logo', models.ImageField(default='unknown_plugin.gif', max_length=255, upload_to=eric.core.models.base.UploadToPathAndRename('plugin_logos'), verbose_name='A logo for the plugin')),
                ('path', models.CharField(max_length=1950, verbose_name='path where the app-root resides')),
                ('placeholder_picture', models.ImageField(blank=True, default='unknown_plugin.gif', max_length=512, null=True, upload_to='plugin/', verbose_name="A placeholder image, used when the 3rd-party app doesn't provide a screenshot")),
                ('placeholder_picture_mime_type', models.CharField(default='image/png', max_length=255, verbose_name='Mime type of the placeholder picture')),
                ('user_availability', models.CharField(choices=[('GLB', 'Global'), ('USR', 'Only selected users')], default='GLB', max_length=3, verbose_name='User availability for this plugin')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='plugin_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='plugin_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('responsible_users', models.ManyToManyField(to='projects.MyUser')),
                ('user_availability_selected_user_groups', models.ManyToManyField(blank=True, related_name='plugins', to='auth.Group', verbose_name='The selected user groups this plugin is available for')),
                ('user_availability_selected_users', models.ManyToManyField(blank=True, related_name='plugins', to=settings.AUTH_USER_MODEL, verbose_name='The selected users this plugin is available for')),
            ],
            options={
                'verbose_name': 'Plugin',
                'verbose_name_plural': 'Plugins',
                'ordering': ['title'],
                'permissions': (),
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='PluginInstance',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='Title of the plugin')),
                ('rawdata', models.FileField(blank=True, null=True, upload_to='plugin/', verbose_name='File representation of the instance')),
                ('rawdata_mime_type', models.CharField(default='application/octet-stream', max_length=255, verbose_name='Mime type of the uploaded rawdata')),
                ('rawdata_size', models.BigIntegerField(default=0, verbose_name='Size of rawdata')),
                ('picture', models.ImageField(blank=True, max_length=512, null=True, upload_to='plugin/', verbose_name='A graphic rendition of the rawdata returned by the 3rd-party app')),
                ('picture_mime_type', models.CharField(default='image/png', max_length=255, verbose_name='Mime type of the picture representation')),
                ('picture_size', models.BigIntegerField(default=0, verbose_name='Size of picture representation')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='plugininstance_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='plugininstance_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('plugin', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='plugins.Plugin')),
                ('projects', models.ManyToManyField(blank=True, related_name='plugininstances', to='projects.Project', verbose_name='Which projects is this plugin instance associated to')),
            ],
            options={
                'verbose_name': 'Plugin Instance',
                'verbose_name_plural': 'Plugin Instances',
                'ordering': ['title'],
                'permissions': (('trash_plugininstance', 'Can trash a plugin instance'), ('restore_plugininstance', 'Can restore a plugin instance'), ('add_plugininstance_without_project', 'Can add a plugin instance without a project'), ('change_project_plugininstance', 'Can change the project of a plugin instance')),
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, eric.core.models.base.LockMixin, models.Model, eric.core.models.abstract.WorkbenchEntityMixin),
        ),
        migrations.CreateModel(
            name='UploadedPluginInstanceFileEntry',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('file', models.FileField(blank=True, null=True, upload_to='plugin/', verbose_name='File representation of the instance rawdata/picture')),
                ('mime_type', models.CharField(default='application/octet-stream', max_length=255, verbose_name='Mime type of the uploaded rawdata/picutre')),
                ('size', models.BigIntegerField(default=0, verbose_name='Size of rawdata/picture')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploadedplugininstancefileentry_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploadedplugininstancefileentry_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('plugininstance', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plugininstance_entries', to='plugins.PluginInstance', verbose_name='Which plugininstance this entry is related to')),
            ],
            options={
                'ordering': ['file', 'id'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
        ),
        migrations.AddField(
            model_name='plugininstance',
            name='uploaded_picture_entry',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='plugins.UploadedPluginInstanceFileEntry', verbose_name='Reference to the archived data'),
        ),
        migrations.AddField(
            model_name='plugininstance',
            name='uploaded_rawdata_entry',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='plugins.UploadedPluginInstanceFileEntry', verbose_name='Reference to the archived data'),
        ),
    ]
