#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.db import transaction

from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.labbooks.rest.serializers import DetailedLabBookChildElementSerializer
from eric.metadata.rest.serializers import EntityMetadataSerializer, EntityMetadataSerializerMixin
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField
from eric.shared_elements.models import Note

User = get_user_model()


class NoteSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """Serializer for Notes"""

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    labbook_container = DetailedLabBookChildElementSerializer(
        read_only=True,
        many=False,
    )

    class Meta:
        model = Note

        fields = (
            "subject",
            "content",
            "projects",
            "labbook_container",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "version_number",
            "url",
            "metadata",
            "is_favourite",
        )

    @transaction.atomic
    def create(self, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        instance = super().create(validated_data)
        self.create_metadata(metadata_list, instance)

        # read the request data and add the values of relates_to_content_type_id, relates_to_pk and private to the
        # instance so they can be used to create a relation within the viewset
        request = self.context["request"]
        instance.relates_to_content_type_id = request.data.get("relates_to_content_type_id")
        instance.relates_to_pk = request.data.get("relates_to_pk")
        instance.private = request.data.get("private")

        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        self.update_metadata(metadata_list, instance)
        return super().update(instance, validated_data)
