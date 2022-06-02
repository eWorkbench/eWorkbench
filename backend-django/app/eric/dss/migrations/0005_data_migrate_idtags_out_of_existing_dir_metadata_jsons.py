# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import os

from django.db import migrations, transaction
from django_changeset.models import RevisionModelMixin

from eric.core.models import disable_permission_checks
from eric.dss.models.models import get_upload_to_path, dss_storage
from eric.shared_elements.models.models import File



def migrate_idtags_out_of_existing_dir_metadata_json_forward(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias

    dir_metadata_files = File.objects.using(db_alias).filter(
        name="dir_metadata.json",
        imported=True,
    )

    with disable_permission_checks(File):
        for dir_metadata_file in dir_metadata_files:
            file_path = get_upload_to_path(dir_metadata_file, dir_metadata_file.name)
            file_path = os.path.join(dss_storage.location, file_path)
            if os.path.isfile(file_path):
                with open(file_path, 'r') as infile:
                    dir_metadata_file_content = json.loads(infile.read())
                for entry in dir_metadata_file_content:
                    if "idtag" in entry.keys():
                        idtag_id = entry["idtag"]
                        idtag = f"<p>idtag: {idtag_id}</p>"
            if idtag:
                File.objects.using(db_alias).filter(
                    directory=dir_metadata_file.directory,
                    imported=True,
                ).update(description=idtag)

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):
    dependencies = [
        ('dss', '0004_add_dss_container_how_to_cms_texts'),
        ('shared_elements', '0030_file_add_imported_field'),
    ]

    operations = [
        migrations.RunPython(
            migrate_idtags_out_of_existing_dir_metadata_json_forward,
            migrations.RunPython.noop
        ),
    ]
