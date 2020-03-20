#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django_userforeignkey.request import get_current_request

from eric.core.utils import convert_base64_image_strings_to_file_references
from eric.base64_image_extraction.models import *

import logging

logger = logging.getLogger(__name__)


def convert_text_with_base64_images_to_file_references(source, source_field):
    """
    Parse content, find base64 references, upload image files to system and convert references to image URLs.

    :param source: Source object
    :param source_field: Field of source object
    :return:
    """
    request = get_current_request()
    content = getattr(source, source_field)
    image_references = convert_base64_image_strings_to_file_references(content)

    for image_reference in image_references:
        image = upload_and_create_extracted_image(
            file_name=image_reference['file_name'],
            binary=image_reference['binary'],
            mime_type=image_reference['mime_type'],
            source=source,
            source_field=source_field
        )
        if image:
            image_url = get_uri_for_extracted_image(image, True, request)
            content = content.replace(image_reference['base64'], image_url)

    return content


def upload_and_create_extracted_image(file_name, binary, mime_type, source, source_field):
    """
    Upload extracted image files to the server and add a reference to the system.

    :param file_name: File name for uploaded image
    :param binary: Binary object for image file
    :param mime_type: Mime type for image file
    :param source: Source object which gets references with a GenericForeignKey
    :param source_field: Field of source object the image was extracted from
    :return: ExtractedImage object
    """
    try:
        image_file = SimpleUploadedFile(
            name=file_name,
            content=binary.read(),
            content_type=mime_type
        )

        return ExtractedImage.objects.create(
            image=image_file,
            source=source,
            source_field=source_field
        )
    except Exception as e:
        logger.error(e)
        return None


def get_uri_for_extracted_image(image, absolute=False, request=None):
    """
    Generate an absolute URI to the static file for the extracted image on the server.

    :param image: ExtractedImage object
    :param absolute: Boolean to declare if an absolute URI should be generated
    :param request: Request object
    :return: Absolute URI for image element
    """
    relative_url = reverse('extracted-image', kwargs={
        'pk': image.pk,
        'secret': image.secret
    })
    if absolute and request:
        return request.build_absolute_uri(relative_url)
    else:
        return relative_url
