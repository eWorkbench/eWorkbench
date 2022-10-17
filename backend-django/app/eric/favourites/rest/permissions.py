#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" defines custom permission settings for the REST API """
from django.contrib.contenttypes.models import ContentType

from rest_framework import permissions


class HasFavouritedModelAccess(permissions.BasePermission):
    """
    Custom permission to only allow to create a favourite if the referenced model instance is accessible for this user
    """

    def has_object_permission(self, request, view, obj):
        """returns True when the request method is in SAFE_METHODS (e.g., GET, HEAD, OPTIONS),
        otherwise the request.user has to have access to the referenced model"""
        # allow GET / HEAD / OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True

        try:
            object_id = request.data["object_id"]
            content_type_pk = request.data["content_type_pk"]

            content_type = ContentType.objects.get(pk=content_type_pk)

            ModelClass = content_type.model_class()

            favourited_model = ModelClass.objects.get(pk=object_id)

            # Write permissions only if the user has access to the referenced model-instance
            return ModelClass.objects.viewable().filter(pk=favourited_model.pk).exists()
        except KeyError:
            return False
