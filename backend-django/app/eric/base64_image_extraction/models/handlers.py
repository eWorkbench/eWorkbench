#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os

from django.db.models.signals import post_delete
from django.dispatch import receiver

from eric.base64_image_extraction.models.models import ExtractedImage


@receiver(post_delete, sender=ExtractedImage)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes image from filesystem when corresponding `ExtractedImage` object is deleted.
    """
    if instance.image and os.path.isfile(instance.image.path):
        os.remove(instance.image.path)
