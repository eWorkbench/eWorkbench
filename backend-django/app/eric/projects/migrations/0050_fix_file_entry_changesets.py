#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import uuid

from django_changeset.models import RevisionModelMixin

def fix_changeset_for_file_entries(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias

    ChangeSet = apps.get_model('django_changeset', "ChangeSet")

    ContentType = apps.get_model('contenttypes', "ContentType")
    User = apps.get_model('auth', 'User')

    File = apps.get_model('projects', 'File')
    UploadedFileEntry = apps.get_model('projects', 'UploadedFileEntry')

    # get the first superuser as the alternative user
    alternative_user = User.objects.filter(is_superuser=True).first()

    file_content_type = ContentType.objects.using(db_alias).get(
        app_label='shared_elements',
        model='file'
    )

    uploaded_file_entry_content_type = ContentType.objects.using(db_alias).get(
        app_label='shared_elements',
        model='uploadedfileentry'
    )

    # iterate over all file entries
    for entry in UploadedFileEntry.objects.using(db_alias).all():
        # check if the file entry has an insert changeset

        insert_changeset = ChangeSet.objects.using(db_alias).filter(
            object_uuid=entry.pk,
            object_type=uploaded_file_entry_content_type,
            changeset_type='I'
        ).first()

        # if there is no insert changeset, create one
        if not insert_changeset:
            # get insert_changest of file
            file_insert_changeset = ChangeSet.objects.using(db_alias).filter(
                object_uuid=entry.file.pk,
                object_type=file_content_type,
                changeset_type='I'
            ).first()

            # also, if there is no insert changeset, we need to create one
            if not file_insert_changeset:
                file_insert_changeset = ChangeSet.objects.using(db_alias).create(
                    object_uuid=entry.file.pk,
                    object_type=file_content_type,
                    changeset_type='I',
                    user=alternative_user
                )

            # get user of file_insert_changeset
            file_created_by = file_insert_changeset.user

            # create a new insert changeset for the file entry
            insert_changeset = ChangeSet.objects.using(db_alias).create(
                user=file_created_by,
                object_uuid=entry.pk,
                object_type=uploaded_file_entry_content_type,
                changeset_type='I'
            )

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0049_rename_change_project_permission'),
    ]

    operations = [
        migrations.RunPython(
            fix_changeset_for_file_entries
        ),
    ]


