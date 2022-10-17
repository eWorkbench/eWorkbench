# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import os

from django.db import migrations

from django_changeset.models import RevisionModelMixin

from eric.core.models import DisableSignals, disable_permission_checks
from eric.dss.models import DSSContainer
from eric.dss.models.models import DSSFilesToImport
from eric.shared_elements.models import File, UploadedFileEntry

logger = logging.getLogger(__name__)




def migrate_dss_to_new_filesystem(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    path_separator = os.sep
    new_filesystem_path = path_separator.join(["dssfs03", "tumdss"])

    # DSSContainer
    dss_containers = DSSContainer.objects.using(db_alias).all()
    with disable_permission_checks(DSSContainer):
        with DisableSignals():
            for dss_container in dss_containers:
                old_path = dss_container.path
                if not old_path.startswith(new_filesystem_path):
                    old_path_filesystem = old_path.split(path_separator)[0]  # Part 0 is the dss filesystem
                    new_path = old_path.replace(old_path_filesystem, new_filesystem_path)
                    logger.info(f"Migrate DSSContainer old_path {old_path} to new_path {new_path}")
                    dss_container.path = new_path
                    dss_container.save()

    # DSSFilesToImport
    dss_filestoimport = DSSFilesToImport.objects.using(db_alias).all()
    with disable_permission_checks(DSSFilesToImport):
        with DisableSignals():
            for dss_filetoimport in dss_filestoimport:
                old_path = dss_filetoimport.path
                if not new_filesystem_path in old_path:
                    old_path_filesystem = old_path.split(path_separator)[2]  # Part 2 is the dss filesystem
                    new_path = old_path.replace(old_path_filesystem, new_filesystem_path)
                    logger.info(f"Migrate DSSFilesToImport old_path {old_path} to new_path {new_path}")
                    dss_filetoimport.path = new_path
                    dss_filetoimport.save()

    # File
    dss_files = File.objects.using(db_alias).filter(imported=True)
    with disable_permission_checks(File):
        with DisableSignals():
            for dss_file in dss_files:
                old_path = dss_file.path.name
                if not old_path.startswith(new_filesystem_path):
                    old_path_filesystem = old_path.split(path_separator)[0]  # Part 0 is the dss filesystem
                    new_path = old_path.replace(old_path_filesystem, new_filesystem_path)
                    logger.info(f"Migrate File old_path {old_path} to new_path {new_path}")
                    dss_file.path.name = new_path
                    dss_file.save(dds_migration=True)

    # UploadedFileEntry
    dss_uploaded_file_entries = UploadedFileEntry.objects.using(db_alias).filter()
    with disable_permission_checks(UploadedFileEntry):
        with DisableSignals():
            for dss_uploaded_file_entry in dss_uploaded_file_entries:
                old_path = dss_uploaded_file_entry.path.name
                if dss_uploaded_file_entry.path.path.startswith('/dss') and \
                        not old_path.startswith(new_filesystem_path):
                    old_path_filesystem = old_path.split(path_separator)[0]  # Part 0 is the dss filesystem
                    new_path = old_path.replace(old_path_filesystem, new_filesystem_path)
                    logger.info(f"Migrate UploadedFileEntry old_path {old_path} to new_path {new_path}")
                    dss_uploaded_file_entry.path.name = new_path
                    dss_uploaded_file_entry.save()

    RevisionModelMixin.set_enabled(True)

class Migration(migrations.Migration):

    dependencies = [
        ('dss', '0006_alter_dssenvelope_metadata_file_content'),
    ]

    operations = [
        migrations.RunPython(
            migrate_dss_to_new_filesystem,
            migrations.RunPython.noop
        ),
    ]
