#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import url
from django.views.decorators.csrf import csrf_exempt

from eric.core.views import current_version_view, oss_license_json, js_error_logger_view, clean_workbench_models

urlpatterns = [
    url(r'^version', current_version_view),
    url(r'^oss_licenses', oss_license_json),
    url(r'^js_error_logger', csrf_exempt(js_error_logger_view)),
    url(r'^clean_workbench_models', clean_workbench_models),
]
