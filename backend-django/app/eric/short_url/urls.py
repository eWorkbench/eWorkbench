#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.urls import re_path

from eric.short_url.views import RedirectView


urlpatterns = [
    re_path(r'^(?P<pk>.*)/$', RedirectView.as_view(), name='short-url'),
]
