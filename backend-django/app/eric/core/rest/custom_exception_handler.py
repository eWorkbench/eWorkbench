#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
from smtplib import SMTPException

import django.core.exceptions
from django.http import Http404
from django_changeset.models.mixins import ConcurrentUpdateException
from rest_framework.exceptions import APIException, ValidationError, PermissionDenied
from rest_framework.views import exception_handler

from eric.projects.models import UserStorageLimitReachedException, MaxFileSizeReachedException

logger = logging.getLogger('eric.core.rest.custom_exception_handler')


class APIConcurrentUpdateException(APIException):
    """
    Custom DRF Exception for API Concurrent Update Exception (raised by ChangeSet on a "version" field mismatch, which
    indicates that someone else has edited an element (therefore concurrent udpate).
    Converts a Concurrent Update Exception to a valid DRF Exception (APIException)
    """
    status_code = 412  # Precondition failed
    default_detail = "Concurrent update exception"

    def __init__(self, concurrent_update_exception):
        self.detail = {
            'detail': "Concurrent update exception",
            'latest_version_number': concurrent_update_exception.latest_version_number
        }

    def __str__(self):
        return "Concurrent update exception"


class APIUserStorageLimitReachedException(APIException):
    """
    Custom DRF Exception for User Storage Limit Reached (raised when a file or picture is uploaded and with this
    picture the user storage limit will be reached).
    Converts a User Storage Limit Reached Exception to a valid DRF Exception (APIException)
    """
    status_code = 507  # Insufficient Storage
    default_detail = "User storage limit reached"

    def __init__(self, user_storage_limit_reached_exception):
        self.detail = {
            'detail': "User storage limit reached",
            'available_storage': user_storage_limit_reached_exception.available_storage
        }

    def __str__(self):
        return "User storage limit reached"


class APIMaxFileSizeReachedException(APIException):
    """
    Custom DRF Exception for API Max File Size Reached (raised when a file or picture is uploaded and it's too large).
    Converts a Max File Size Reached Exception to a valid DRF Exception (APIException)
    """
    status_code = 507  # Insufficient Storage
    default_detail = "Max file size reached"

    def __init__(self, max_file_size_reached_exception):
        self.detail = {
            'detail': "File is too large",
            'max_file_size': max_file_size_reached_exception.max_file_size
        }

    def __str__(self):
        return "User storage limit reached"


def custom_exception_handler(exc, context):
    """
    handles various Django core exceptions (such as ValidationError and PermissionDenied) and converts them into
    Django REST Framework Exceptions
    :param exc:
    :param context:
    :return:
    """
    logger.info('Custom Exception Handler called with type {exception_type}'.format(exception_type=type(exc)))

    # Handle ConcurrentUpdateExceptions
    if type(exc) is ConcurrentUpdateException:
        exc = APIConcurrentUpdateException(exc)
    # Handle MaxFileSizeReachedException
    elif type(exc) is MaxFileSizeReachedException:
        exc = APIMaxFileSizeReachedException(exc)
    # Handle UserStorageLimitReachedException
    elif type(exc) is UserStorageLimitReachedException:
        exc = APIUserStorageLimitReachedException(exc)
    # Handle Django Validation Errors (convert them into Django REST Validation Errors)
    elif type(exc) is django.core.exceptions.ValidationError:
        if hasattr(exc, "message_dict"):
            exc = ValidationError(exc.message_dict)
        elif hasattr(exc, "messages"):
            exc = ValidationError(exc.messages)
        else:
            exc = ValidationError(exc)
    # Handle Django Permission Errors (convert t hem into Django REST Permission Errors)
    elif type(exc) is django.core.exceptions.PermissionDenied:
        if len(exc.args) >= 1:
            exc = PermissionDenied(exc)
        else:
            exc = PermissionDenied()
    # Handle mail errors (e.g. mail quota exceeded)
    elif type(exc) is SMTPException:
        exc = APIException(exc)
    elif isinstance(exc, APIException) or isinstance(exc, Http404):
        # exc is a rest_framework APIException, so we can pass it on to the rest api exception handler
        pass
    else:
        logger.debug("Potentially unhandled exception of type {exception_type}".format(exception_type=type(exc)))

    # Call REST framework's default exception handler to get the standard error response (for validation, permission
    # and similar errors)
    response = exception_handler(exc, context)

    if response is None:
        # this error seems to be caused by something else, lets make sure we know about it in our log
        logger.error("Unhandled exception of type {exception_type}".format(exception_type=type(exc)))
        logger.error(str(exc))

    return response
