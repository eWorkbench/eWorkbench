#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os

from django.db.models.signals import post_delete
from django.dispatch import receiver

from eric.pictures.models import Picture
from eric.pictures.models.models import Picture, UploadedPictureEntry


@receiver(post_delete)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes picture from filesystem
    when corresponding `Picture` object is deleted.
    """
    # only handle Pictures UploadedPictureEntry
    if not sender == Picture and not sender == UploadedPictureEntry:
        return

    if instance.background_image and os.path.isfile(instance.background_image.path):
        os.remove(instance.background_image.path)

    if instance.shapes_image and os.path.isfile(instance.shapes_image.path):
        os.remove(instance.shapes_image.path)

    if instance.rendered_image and os.path.isfile(instance.rendered_image.path):
        os.remove(instance.rendered_image.path)

    # the worst part comes now: we might have to iterate over all changeset entries in order to find all previous files
    for cs in instance.changesets.all():
        print(cs)
        for cr in cs.change_records.filter(field_name__in=['background_image', 'shapes_image', 'rendered_image']):
            # check if old-value is a file and delete it
            if cr.old_value and os.path.isfile(cr.old_value):
                os.remove(cr.old_value)
            # check if new-value is a file and delete it
            if cr.new_value and os.path.isfile(cr.new_value):
                os.remove(cr.new_value)
