# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import IntegrityError, migrations, models

from eric.core.models import disable_permission_checks


def reference_latest_uploaded_file(apps, schema_editor):
    File = apps.get_model('shared_elements', 'File')
    UploadedFileEntry = apps.get_model('shared_elements', 'UploadedFileEntry')

    with disable_permission_checks(File):
        with disable_permission_checks(UploadedFileEntry):
            for file in File.objects.all():
                # use latest UploadedFileEntry
                file.uploaded_file_entry = UploadedFileEntry.objects \
                    .filter(file=file) \
                    .order_by('created_at') \
                    .last()

                # no UploadedFileEntry exists -> report error
                if file.uploaded_file_entry is None:
                    raise IntegrityError("There is no UploadedFileEntry for file " + str(file))

                file.save()


class Migration(migrations.Migration):
    dependencies = [
        ('shared_elements', '0011_element_label_optional_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='uploaded_file_entry',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                                       related_name='+', to='shared_elements.UploadedFileEntry',
                                       verbose_name='Reference to the archived data'),
        ),
        migrations.RunPython(
            reference_latest_uploaded_file,
            migrations.RunPython.noop
        )
    ]
