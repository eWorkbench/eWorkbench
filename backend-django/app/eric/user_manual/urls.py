#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for shared elements """
from django.conf.urls import include
from django.urls import re_path

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.user_manual.rest.viewsets import UserManualCategoriesViewset, UserManualHelpTextViewset

router = get_api_router()


# register user manual category and help texts
router.register("user_manual", UserManualCategoriesViewset, basename="usermanualcategory")

user_manual_router = routers.NestedSimpleRouter(router, r"user_manual", lookup="usermanualcategory")
user_manual_router.register(r"help_texts", UserManualHelpTextViewset, basename="usermanualcategory-usermanualhelptext")


urlpatterns = [
    re_path(r"^", include(user_manual_router.urls)),
]
