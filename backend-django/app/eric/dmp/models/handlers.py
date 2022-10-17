#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.db.models.signals import pre_save
from django.dispatch import receiver

from eric.base64_image_extraction.utils import convert_text_with_base64_images_to_file_references
from eric.dmp.models import DmpFormData

logger = logging.getLogger("eric.dmp.models.handlers")


@receiver(pre_save, sender=DmpFormData)
def convert_dmp_form_data_value_with_base64_images_to_file_references(sender, instance, *args, **kwargs):
    """
    Parse DmpFormData value, find base64 references, upload image files to system and convert references to image URLs.

    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    instance.value = convert_text_with_base64_images_to_file_references(instance, "value")
