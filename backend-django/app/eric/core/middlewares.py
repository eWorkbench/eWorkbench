#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import datetime
import logging
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connection
from django.utils.cache import add_never_cache_headers
from django.utils.deprecation import MiddlewareMixin

from django_changeset.models.mixins import RevisionModelMixin
from django_userforeignkey.request import get_current_user

User = get_user_model()

request_logger = logging.getLogger("django.middleware.request_time_logging")


class HTTPXForwardedForMiddleware(MiddlewareMixin):
    """
    Middleware that processes the HTTP_X_FORWARDED_FOR Header
    if REMOTE_ADDR is not set or within the trusted pool
    """

    def process_request(self, request):

        from django.conf import settings

        HTTP_X_FORWARDED_FOR_TRUSTED_PROXIES = getattr(settings, "HTTP_X_FORWARDED_FOR_TRUSTED_PROXIES", [])

        # check if remote addr is unset or if it is set, it needs to be within the trusted proxies
        if "REMOTE_ADDR" not in request.META or request.META["REMOTE_ADDR"] in HTTP_X_FORWARDED_FOR_TRUSTED_PROXIES:
            if "HTTP_X_FORWARDED_FOR" in request.META:
                request.META["REMOTE_ADDR"] = request.META["HTTP_X_FORWARDED_FOR"].split(",")[0].strip()


class DisableChangeSetForReadOnlyRequestsMiddleware(MiddlewareMixin):
    """
    Middleware class for disabling the revision model (changeset) for GET/HEAD/OPTIONS calls
    This used to be in the dispatch method of the REST API ViewSet, but it is better suited within the Request/Response
    cycle so it covers also the Browsable API of DRF aswell as ALL GET requests of Django (e.g., Admin Panel)

    If the ChangeSet (or RevisionModel) is enabled, additional db queries are executed, also some signals are fired
    This is not needed for read only requests, such as GET/HEAD/OPTIONS
    """

    def process_request(self, request):
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            # disable the revision model / changesets
            RevisionModelMixin.set_enabled(False)

    def process_response(self, request, response):
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            # enable the revision model / changesets again
            RevisionModelMixin.set_enabled(True)
        return response


# original sources from:
# https://gist.github.com/j4mie/956843
# and
# https://djangosnippets.org/snippets/1826/
class RequestTimeLoggingMiddleware(MiddlewareMixin):
    """Middleware class logging request time to stderr.

    This class can be used to measure time of request processing
    within Django.  It can be also used to log time spent in
    middleware and in view itself, by putting middleware multiple
    times in INSTALLED_MIDDLEWARE.

    Static method `log_message` may be used independently of the
    middleware itself, outside of it, and even when middleware is not
    listed in INSTALLED_MIDDLEWARE.
    """

    @staticmethod
    def log_message(request, tag, message=""):
        """Log timing message to stderr.

        Logs message about `request` with a `tag` (a string, 10
        characters or less if possible), timing info and optional
        `message`.

        Log format is "timestamp tag uuid count path +delta message"

        - timestamp is microsecond timestamp of message
        - tag is the `tag` parameter
        - uuid is the UUID identifying request
        - count is number of logged message for this request
        - path is request.path
        - delta is timedelta between first logged message for this request and current message
        - message is the `message` parameter.
        """

        dt = datetime.datetime.utcnow()
        if not hasattr(request, "_logging_uuid"):
            request._logging_uuid = uuid.uuid1()
            request._logging_start_dt = dt
            request._logging_pass = 0

        request._logging_pass += 1

        # replace commas in path, so the output can be parsed easily
        # (commas can be in path for file names etc.)
        path = str(request.get_full_path).replace(",", " ")

        request_logger.debug(
            "%s, %s, %s, %d, %s, %s, %0.4f seconds, %s"
            % (
                dt.isoformat(),
                tag,
                request._logging_uuid,
                request._logging_pass,
                request.method,
                path,
                (dt - request._logging_start_dt).total_seconds(),
                message,
            )
        )

    def process_request(self, request):
        self.log_message(request, "request ")

    def process_response(self, request, response):
        s = getattr(response, "status_code", 0)
        r = f"by {str(get_current_user())}, status {str(s)}, "
        if s in (300, 301, 302, 307):
            r += " redirect to %s" % response.get("Location", "?")
        elif hasattr(response, "content") and response.content:
            r += " sent %d bytes" % len(response.content)
        elif hasattr(response, "streaming_content") and response.streaming_content:
            r += " streaming / downloading"

        # if status code is 2xx and debug mode is activated
        if 200 <= s <= 299 and settings.DEBUG:
            total_time = 0

            for query in connection.queries:
                query_time = query.get("time")
                if query_time is None:
                    # django-debug-toolbar monkeypatches the connection
                    # cursor wrapper and adds extra information in each
                    # item in connection.queries. The query time is stored
                    # under the key "duration" rather than "time" and is
                    # in milliseconds, not seconds.
                    query_time = query.get("duration", 0) / 1000
                total_time += float(query_time)

            r += ", %d queries, %0.4f seconds" % (len(connection.queries), total_time)

        self.log_message(request, "response", r)
        return response


class DisableClientSideCachingMiddleware(MiddlewareMixin):
    """
    Internet Explorer / Edge tends to cache REST API calls, unless some specific HTTP headers are added by our
    application.

    - no_cache
    - no_store
    - must_revalidate

    :param django.http.Request request: the request that is being handled
    :param django.http.Response response: the response that his being forwarded
    :return response
    """

    def process_response(self, request, response):
        # avoid setting never-cache headers for GET requests without parameters -> those can be cached
        if request.method == "GET" and len(request.GET.keys()) == 0 and response.streaming:
            pass
        elif request.method == "GET" and request.path == "/webdav/auth/":
            # do not add this header to the webdav/auth endpoint, as it can be cached by nginx
            pass
        else:
            add_never_cache_headers(response)

        return response
