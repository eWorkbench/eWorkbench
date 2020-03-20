#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import url
from eric.short_url.views import RedirectView


urlpatterns = [
    url(r'^(?P<pk>.*)/$', RedirectView.as_view(), name='short-url'),
]
