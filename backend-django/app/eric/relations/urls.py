#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""
URL Configuration for eric relations
"""
from django.conf.urls import include
from django.urls import re_path

from eric.core.rest.routers import CustomSimpleRouter

# register REST API Routers
router = CustomSimpleRouter()

urlpatterns = [
    re_path(r"^", include(router.urls)),  # browsable REST API
]
