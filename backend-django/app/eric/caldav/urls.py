#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import url, include

urlpatterns = [
    url(r'^', include(('djradicale.urls', 'djradicale'))),
]
