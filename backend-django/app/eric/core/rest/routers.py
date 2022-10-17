#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework_nested import routers

__all__ = [
    "get_api_router",
]
__router = None


def get_api_router():
    """
    Singleton pattern for getting a DRF router
    :return:
    """
    global __router
    if not __router:
        __router = CustomSimpleRouter()
    return __router


class CustomSimpleRouter(routers.DefaultRouter):
    """
    Adds a "better" get default base name method
    """

    def get_default_basename(self, viewset):
        # get the serializer class of the viewset
        serializer = getattr(viewset, "serializer_class", None)
        # if serializer is set and .Meta.model is set, we can access the models name and return it
        if serializer is not None and serializer.Meta.model is not None:
            return serializer.Meta.model.__name__.lower()

        # else: do whatever the super class wants to do
        return super().get_default_basename(viewset)


class CustomNestedSimpleRouter(routers.NestedSimpleRouter):
    """
    Adds a "better" get default base name method
    """

    def get_default_basename(self, viewset):
        # get the serializer class of the viewset
        serializer = getattr(viewset, "serializer_class", None)
        # if serializer is set and .Meta.model is set, we can access the models name and return it
        if serializer is not None and serializer.Meta.model is not None:
            return serializer.Meta.model.__name__.lower()

        # else: do whatever the super class wants to do
        return super().get_default_basename(viewset)
