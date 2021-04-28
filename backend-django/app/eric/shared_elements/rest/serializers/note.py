#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.db import transaction

from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer, BaseModelWithCreatedBySerializer
from eric.metadata.rest.serializers import EntityMetadataSerializer, EntityMetadataSerializerMixin
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField
from eric.shared_elements.models import Note

User = get_user_model()


class NoteSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """ Serializer for Notes """
    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    class Meta:
        model = Note
        fields = (
            'subject', 'content', 'projects',
            'created_by', 'created_at', 'last_modified_by', 'last_modified_at', 'version_number',
            'url', 'metadata', 'is_favourite'
        )

    @transaction.atomic
    def create(self, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        instance = super(NoteSerializer, self).create(validated_data)
        self.create_metadata(metadata_list, instance)
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        self.update_metadata(metadata_list, instance)
        return super(NoteSerializer, self).update(instance, validated_data)
