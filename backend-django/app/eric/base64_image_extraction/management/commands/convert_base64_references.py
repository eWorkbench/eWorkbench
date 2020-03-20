#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.management.base import BaseCommand
from django.core.validators import URLValidator, ValidationError
from django.db import transaction
from django.test import RequestFactory
from django_userforeignkey.request import set_current_request

from eric.base64_image_extraction.config import *
from eric.base64_image_extraction.utils import upload_and_create_extracted_image, get_uri_for_extracted_image
from eric.core.utils import convert_base64_image_strings_to_file_references


def set_request_for_user(user):
    """
    Sets the request context for a given system user.

    :param user: User object
    :return: Request context
    """
    request = RequestFactory().request(**{})
    setattr(request, 'user', user)
    set_current_request(request)

    return request


def replace_image_references_in_texts(class_object, source_field, base_url):
    """
    Replaces all base64 image references with image URLs.

    :param class_object: Class object which contains a list of iterable elements
    :param source_field: Field of class_object the image will be extracted from
    :param base_url: Absolute URL which should be prepended to the relative image URLs
    :return:
    """
    for element in class_object.objects.all():
        request = set_request_for_user(element.last_modified_by)
        print('Work on element {} of type {} as user {}...'.format(element.pk, type(element), request.user))

        element_content = getattr(element, source_field)

        image_references = convert_base64_image_strings_to_file_references(element_content)
        if not image_references:
            print('...done. Did not find any image reference(s).')
            continue

        element_content = replace_content_with_image_urls(image_references, base_url, element, source_field)
        class_object.objects.filter(pk=element.pk).update(**{source_field: element_content})
        print('Work on element {} of type {} finished.'.format(element.pk, type(element)))


def replace_content_with_image_urls(image_references, base_url, source, source_field):
    """
    Uploads all image references and replace those with final URLs.

    :param image_references: List of image references
    :param base_url: Absolute URL which should be prepended to the relative image URLs
    :param source: Source object which gets references with a GenericForeignKey
    :param source_field: Field of source object the image was extracted from
    :return:
    """
    content = getattr(source, source_field)

    for image_reference in image_references:
        print('Work on image reference {}...'.format(image_reference['file_name']))
        image = upload_and_create_extracted_image(
            file_name=image_reference['file_name'],
            binary=image_reference['binary'],
            mime_type=image_reference['mime_type'],
            source=source,
            source_field=source_field
        )

        if image:
            image_url = '{}{}'.format(base_url, get_uri_for_extracted_image(image))
            content = content.replace(image_reference['base64'], image_url)
            print('...done. Created image element {}.'.format(image.pk))
        else:
            print('...failed')
            raise ValueError('Failed to convert image reference to image element. Aborting migration.')

    return content


class Command(BaseCommand):
    help = 'Convert base64 references in element texts to URL references'

    def add_arguments(self, parser):
        parser.add_argument('base-url', type=str)

    def handle(self, *args, **options):
        base_url = options['base-url'].rstrip('/')
        try:
            validate = URLValidator(schemes=('http', 'https'))
            validate(base_url)
        except ValidationError:
            self.stdout.write(self.style.ERROR('Please provide a valid URL: {}'.format(base_url)))
            return

        with transaction.atomic():
            for model, field in AFFECTED_MODELS_AND_FIELDS.items():
                replace_image_references_in_texts(model, field, base_url)
