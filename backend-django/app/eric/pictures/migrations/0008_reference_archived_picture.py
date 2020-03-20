# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import migrations, models

from eric.core.models import disable_permission_checks


def reference_latest_uploaded_picture(apps, schema_editor):
    Picture = apps.get_model('pictures', 'Picture')
    UploadedPictureEntry = apps.get_model('pictures', 'UploadedPictureEntry')

    with disable_permission_checks(Picture):
        with disable_permission_checks(UploadedPictureEntry):
            for picture in Picture.objects.all():
                # use the latest UploadedPictureEntry
                picture.uploaded_picture_entry = picture.picture_entries.order_by('created_at').last()

                # if there is no UploadedPictureEntry -> create one
                if picture.uploaded_picture_entry is None:
                    entry = UploadedPictureEntry.objects.create(
                        picture=picture,
                        rendered_image=picture.rendered_image,
                        rendered_image_size=picture.rendered_image_size,
                        background_image=picture.background_image,
                        background_image_size=picture.background_image_size,
                        shapes_image=picture.shapes_image,
                        shapes_image_size=picture.shapes_image_size,
                        width=picture.width,
                        height=picture.height
                    )
                    entry.save()
                    picture.uploaded_picture_entry = entry

                picture.save()


class Migration(migrations.Migration):
    dependencies = [
        ('pictures', '0007_uploaded_picture_entry'),
    ]

    operations = [
        migrations.AddField(
            model_name='picture',
            name='uploaded_picture_entry',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                                       related_name='+', to='pictures.UploadedPictureEntry',
                                       verbose_name='Reference to the archived data'),
        ),
        migrations.RunPython(
            reference_latest_uploaded_picture,
            migrations.RunPython.noop,
        )
    ]
