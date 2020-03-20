#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for projects """
from django.conf.urls import url, include

from eric.core.rest.routers import get_api_router

# texttemplate
from eric.texttemplates.rest.viewsets import TextTemplateViewSet  # , TextTemplateChangeSetViewSet

# get REST API router
router = get_api_router()

# text templates - available globally
router.register(r'texttemplates', TextTemplateViewSet)

urlpatterns = [
]
