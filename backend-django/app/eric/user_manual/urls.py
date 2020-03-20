#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for shared elements """
from django.conf.urls import url, include

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.user_manual.rest.viewsets import UserManualHelpTextViewset, UserManualCategoriesViewset

router = get_api_router()


# register user manual category and help texts
router.register('user_manual', UserManualCategoriesViewset, base_name='usermanualcategory')

user_manual_router = routers.NestedSimpleRouter(router, r'user_manual', lookup='usermanualcategory')
user_manual_router.register(r'help_texts', UserManualHelpTextViewset, base_name='usermanualcategory-usermanualhelptext')


urlpatterns = [
    url(r'^', include(user_manual_router.urls)),
]
