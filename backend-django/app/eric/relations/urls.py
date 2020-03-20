#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""
URL Configuration for eric relations
"""
from django.conf.urls import url, include

from eric.core.rest.routers import CustomSimpleRouter

# register REST API Routers
router = CustomSimpleRouter()

urlpatterns = [
    url(r'^', include(router.urls)),  # browsable REST API
]
