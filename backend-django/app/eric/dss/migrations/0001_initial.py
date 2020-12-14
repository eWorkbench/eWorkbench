#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.conf import settings
import django.contrib.postgres.fields.jsonb
import django.contrib.postgres.search
from django.db import migrations, models
import django.db.models.deletion
import django_changeset.models.mixins
import django_userforeignkey.models.fields
import eric.core.models.abstract
import eric.core.models.base
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0101_user_ordering'),
    ]

    operations = [
        migrations.CreateModel(
            name='DSSContainer',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('deleted', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry is deleted or not')),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255, verbose_name='Name of the DSS container')),
                ('path', models.CharField(max_length=4096, unique=True, verbose_name='Path of the DSS container')),
                ('read_write_setting', models.CharField(choices=[('RO', 'Read only'), ('RWNN', 'Read and write no new'), ('RWON', 'Read and write only new'), ('RWA', 'Read and write all')], default='RO', max_length=4, verbose_name='Read and write settings for all envelopes within this container')),
                ('import_option', models.CharField(choices=[('ION', 'Import only new'), ('IL', 'Import list'), ('IA', 'Import all')], default='ION', max_length=3, verbose_name='Import options for envelopes within this container')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dsscontainer_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dsscontainer_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
                ('projects', models.ManyToManyField(blank=True, related_name='dss_containers', to='projects.Project', verbose_name='Which projects is this DSS container associated to')),
            ],
            options={
                'verbose_name': 'DSS Container',
                'verbose_name_plural': 'DSS Containers',
                'ordering': ['name'],
                'permissions': (('trash_dsscontainer', 'Can trash a DSS container'), ('restore_dsscontainer', 'Can restore a DSS container'), ('change_project_dsscontainer', 'Can change the project of a DSS container'), ('add_dsscontainer_without_project', 'Can add a DSS container without a project')),
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, eric.core.models.base.LockMixin, models.Model, eric.core.models.abstract.WorkbenchEntityMixin),
        ),
        migrations.CreateModel(
            name='DSSFilesToImport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('path', models.CharField(db_index=True, max_length=4096, unique=True, verbose_name='Path of the File to import')),
                ('import_in_progress', models.BooleanField(blank=True, db_index=True, default=False, verbose_name='Whether this DSS File is being imported at the moment')),
                ('imported', models.BooleanField(blank=True, db_index=True, default=False, verbose_name='Whether this DSS File has been imported')),
                ('imported_at', models.DateTimeField(blank=True, db_index=True, editable=False, null=True, verbose_name='Date when this element was created')),
                ('import_attempts', models.IntegerField(default=0, verbose_name='The number of times the DSS Import was attempted for this path')),
                ('last_import_attempt_failed', models.BooleanField(blank=True, db_index=True, default=False, verbose_name='Whether this DSS File to import has failed the last import attempt')),
                ('last_import_attempt_failed_at', models.DateTimeField(blank=True, db_index=True, editable=False, null=True, verbose_name='Date of the last import attempt of the File to import')),
                ('last_import_fail_reason', models.CharField(blank=True, max_length=4096, null=True, verbose_name='Reason the last import attempt failed of the File to import')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
            ],
            options={
                'verbose_name': 'DSS File to import',
                'verbose_name_plural': 'DSS Files to import',
                'ordering': ('created_at',),
            },
        ),
        migrations.CreateModel(
            name='DSSEnvelope',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('imported', models.BooleanField(db_index=True, default=False, verbose_name='Whether this entry was imported by a dss import task or not')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('path', models.CharField(max_length=4096, verbose_name='Path of the DSS envelope')),
                ('metadata_file_content', django.contrib.postgres.fields.jsonb.JSONField(blank=True, verbose_name='The JSON content of the metadata file within this envelope')),
                ('container', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dss_envelopes', to='dss.DSSContainer', verbose_name='Which DSS Container this DSS Envelope is mapped to')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dssenvelope_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dssenvelope_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
            ],
            options={
                'verbose_name': 'DSS Envelope',
                'verbose_name_plural': 'DSS Envelopes',
                'ordering': ('path',),
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
    ]
