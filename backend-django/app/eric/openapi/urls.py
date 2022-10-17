#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.urls import re_path

from rest_framework.permissions import AllowAny

from drf_yasg import openapi as yasg_openapi
from drf_yasg.views import get_schema_view as yasg_get_schema_view

schema_view = yasg_get_schema_view(
    yasg_openapi.Info(
        title="eWorkbench API",
        default_version="1.x",
        description="Backend API documentation",
    ),
    public=True,  # True = Include endpoints the current user has no access to
    permission_classes=(AllowAny,),
)

urlpatterns = [
    re_path(r"^swagger(?P<format>\.json|\.yaml)$", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    re_path(r"^swagger/$", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    re_path(r"^redoc/$", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]
