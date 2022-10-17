#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.favourites.models.models import Favourite
from eric.favourites.rest.permissions import HasFavouritedModelAccess
from eric.favourites.rest.serializers import FavouriteSerializer


class FavouritesViewSet(BaseAuthenticatedModelViewSet):
    """Handles favourites for models."""

    serializer_class = FavouriteSerializer
    permission_classes = (
        IsAuthenticated,
        HasFavouritedModelAccess,
    )

    # disable pagination for this endpoint
    pagination_class = None

    ordering_fields = ("display", "created_at", "user")

    def get_queryset(self):
        """
        Gets all viewable favourites for the current user.
        """
        return Favourite.objects.viewable()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # check if the current user is allowed to access the favourited model
        self.check_object_permissions(request, Favourite)
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    @action(detail=False, methods=["DELETE"], url_name="remove")
    def remove(self, request, format=None, *args, **kwargs):
        """Provides a detail route endpoint for removing a model favourite"""
        object_id = request.query_params["object_id"]
        content_type_id = request.query_params["content_type_pk"]
        try:
            favourite = Favourite.objects.get(object_id=object_id, content_type_id=content_type_id, user=request.user)
        except ObjectDoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        favourite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
