#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.management.base import BaseCommand
from django.core.validators import URLValidator, ValidationError
from django.db import transaction
from django.test import RequestFactory

from django_userforeignkey.request import set_current_request

from eric.base64_image_extraction.config import *


def set_request_for_user(user):
    """
    Sets the request context for a given system user.

    :param user: User object
    :return: Request context
    """
    request = RequestFactory().request(**{})
    setattr(request, "user", user)
    set_current_request(request)

    return request


def replace_url_references_in_texts(class_object, source_field, old_url, new_url):
    """
    Replaces all image reference URLs.

    :param class_object: Class object which contains a list of iterable elements
    :param source_field: Field of class_object the image will be extracted from
    :param old_url: Current (old) image URL
    :param new_url: New image URL which should replace the old ones
    :return:
    """
    for element in class_object.objects.all():
        request = set_request_for_user(element.last_modified_by)
        print(f"Work on element {element.pk} of type {type(element)} as user {request.user}...")

        element_content = replace_url_references(element, source_field, old_url, new_url)
        class_object.objects.filter(pk=element.pk).update(**{source_field: element_content})
        print("...done")


def replace_url_references(source, source_field, old_url, new_url):
    """
    Uploads all image references and replace those with final URLs.

    :param source: Source object which gets references with a GenericForeignKey
    :param source_field: Field of source object the image was extracted from
    :param old_url: Current (old) image URL
    :param new_url: New image URL which should replace the old ones
    :return:
    """
    content = getattr(source, source_field)
    return content.replace(f"{old_url}/extractedimage/", f"{new_url}/extractedimage/")


def check_url(url):
    """
    Checks if a provided URL is valid.

    :param url: Absolute URL which should be used for image URLs
    :return:
    """
    validate = URLValidator(schemes=("http", "https"))
    validate(url.rstrip("/"))


class Command(BaseCommand):
    help = "Replace extracted image URL references in element texts"

    def add_arguments(self, parser):
        parser.add_argument("old-url", type=str)
        parser.add_argument("new-url", type=str)

    def handle(self, *args, **options):
        old_url = options["old-url"].rstrip("/")
        try:
            check_url(old_url)
        except ValidationError:
            self.stdout.write(self.style.ERROR(f"Please provide a valid old URL: {old_url}"))
            return

        new_url = options["new-url"].rstrip("/")
        try:
            check_url(new_url)
        except ValidationError:
            self.stdout.write(self.style.ERROR(f"Please provide a valid new URL: {new_url}"))
            return

        with transaction.atomic():
            for model, field in AFFECTED_MODELS_AND_FIELDS.items():
                replace_url_references_in_texts(model, field, old_url, new_url)
