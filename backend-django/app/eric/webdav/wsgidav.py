#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os

from django.contrib.auth import authenticate
from wsgidav.fs_dav_provider import FilesystemProvider
from wsgidav.wsgidav_app import WsgiDAVApp

from eric.settings.base import MEDIA_ROOT
from importlib import import_module

from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponse
from django.utils import six
from django.utils.decorators import classonlymethod
from django.views import View

from eric.shared_elements.models import File

projects_storage = os.path.join(MEDIA_ROOT, 'projects_storage')
provider = FilesystemProvider(projects_storage)


class WsgiDavDomainController:
    def requireAuthentication(self, realmname, environ):
        return True

    def getDomainRealm(self, inputRelativeURL, environ):
        return environ.get('PATH_INFO').split('/')[1]

    def authDomainUser(self, realmname, username, password, environ):
        user = authenticate(username=username, password=password)
        try:
            return File.objects.viewable()
        except Exception as error:
            return False


config = {
    # "host": "0.0.0.0",
    # "port": 8000,
    "http_authenticator.domain_controller": None,
    "simple_dc": {"user_mapping": {"*": True}},  # anonymous access
    # "http_authenticator.domain_controller": WsgiDavDomainController(),

    'simple_dc.user_mapping': {provider: {None: None}},
    "provider_mapping": {"/": provider},
    "verbose": 1,
    'accept_digest': False,
    'default_to_digest': False,
}
app = WsgiDAVApp(config)

wsgidav_app = WsgiDAVApp(config)


class WsgiView(View):
    application = None

    def __init__(self, **kwargs):
        super(WsgiView, self).__init__(**kwargs)
        self.init_application()

    def init_application(self):
        application = self.application
        if callable(application):
            return
        if isinstance(application, six.string_types):
            self.application = import_module(application)
            return
        raise ImproperlyConfigured(f'{application} is not a WSGI application')

    @classonlymethod
    def as_view(cls, **initkwargs):
        view = super(WsgiView, cls).as_view(**initkwargs)
        return view

    def dispatch(self, request, *args, **kwargs):
        application = self.application
        path = args[0] if len(args) > 0 else ''
        environ = self.get_environ(request, path)
        self.response = HttpResponse()
        result = application(environ, self.start_response)
        try:
            for data in result:
                if data:
                    self.response.write(data)
        finally:
            if hasattr(result, 'close'):
                result.close()
        return self.response

    def get_environ(self, request, path):
        environ = request.META.copy()
        if not path.startswith('/'):
            path += '/'
        environ['SCRIPT_NAME'] += path
        environ['PATH_INFO'] = path
        return environ

    def start_response(self, status, headers, exc_info=None):
        if exc_info:
            raise exc_info[1].with_traceback(exc_info[2])
        self.response.status_code = int(status.split(' ', 1)[0])
        return self.response.write
