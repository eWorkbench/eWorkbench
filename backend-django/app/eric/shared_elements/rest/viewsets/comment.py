#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.contrib.contenttypes.models import ContentType

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.projects.rest.viewsets.base import (
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet,
    LockableViewSetMixIn,
)
from eric.relations.models import Relation
from eric.shared_elements.models import Comment
from eric.shared_elements.rest.filters import CommentFilter
from eric.shared_elements.rest.serializers import CommentSerializer

logger = logging.getLogger(__name__)


class CommentViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet,
    DeletableViewSetMixIn,
    ExportableViewSetMixIn,
    LockableViewSetMixIn,
):
    """REST API Viewset for Comments"""

    serializer_class = CommentSerializer
    filterset_class = CommentFilter
    search_fields = ()

    ordering_fields = ("created_at", "created_by")

    def perform_create(self, serializer):
        """
        Create a relation if the right paramters were added to the instance

        We need to do this here (rather than in a pre_save/post_save handler)
        """
        instance = serializer.save()

        if instance.relates_to_content_type_id and instance.relates_to_pk and instance.private is not None:
            instance_content_type = instance.get_content_type()
            try:
                logger.info(
                    f"Comment viewset perform_create: "
                    f"Creating Relation from object {instance.pk} with content_type_id "
                    f"{instance_content_type.pk} "
                    f"to object {instance.relates_to_pk} with content_type_id "
                    f"{instance.relates_to_content_type_id} and "
                    f"private = {instance.private}."
                )
                left_content_type = ContentType.objects.filter(pk=instance.relates_to_content_type_id).first()
                Relation.objects.create(
                    left_content_type=instance_content_type,
                    left_object_id=instance.pk,
                    right_content_type=left_content_type,
                    right_object_id=instance.relates_to_pk,
                    private=instance.private,
                )
            except Exception as error:
                logger.error(
                    f"Comment viewset perform_create: "
                    f"Cannot create Relation from object {instance.pk} with content_type_id {instance_content_type.pk} "
                    f"to object {instance.relates_to_pk} with content_type_id "
                    f"{instance.relates_to_content_type_id} and "
                    f"private = {instance.private}:"
                    f"{error}"
                )

    def get_queryset(self):
        """
        returns the queryset for ProjectRoleUserAssignment viewable objects,
        filtered by project primary (optional)
        """
        return Comment.objects.viewable().prefetch_common().prefetch_related("projects")
