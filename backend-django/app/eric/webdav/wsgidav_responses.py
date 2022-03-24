#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
try:
    import httplib
except ImportError:
    from http import client as httplib
from django.http import HttpResponse


class ResponseException(Exception):
    def __init__(self, response, *args, **kwargs):
        super(ResponseException, self).__init__('Response excepted', *args, **kwargs)
        self.response = response


class HttpResponsePreconditionFailed(HttpResponse):
    status_code = httplib.PRECONDITION_FAILED


class HttpResponseMediatypeNotSupported(HttpResponse):
    status_code = httplib.UNSUPPORTED_MEDIA_TYPE


class HttpResponseMultiStatus(HttpResponse):
    status_code = httplib.MULTI_STATUS


class HttpResponseNotImplemented(HttpResponse):
    status_code = httplib.NOT_IMPLEMENTED


class HttpResponseBadGateway(HttpResponse):
    status_code = httplib.BAD_GATEWAY


class HttpResponseCreated(HttpResponse):
    status_code = httplib.CREATED


class HttpResponseNoContent(HttpResponse):
    status_code = httplib.NO_CONTENT


class HttpResponseConflict(HttpResponse):
    status_code = httplib.CONFLICT


class HttpResponseLocked(HttpResponse):
    status_code = httplib.LOCKED


class HttpResponseUnAuthorized(HttpResponse):
    status_code = httplib.UNAUTHORIZED
