#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import serializers

from eric.core.rest.serializers import BaseModelSerializer, BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.labbooks.models import LabBook, LabBookChildElement, LabbookSection
from eric.metadata.rest.serializers import EntityMetadataSerializer, EntityMetadataSerializerMixin
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField
from eric.relations.rest.serializers import RelationObjectRelatedField

User = get_user_model()

logger = logging.getLogger(__name__)


class LabBookChildElementSerializer(BaseModelSerializer):
    """Serializer for LabBook Child Elements"""

    child_object = RelationObjectRelatedField(read_only=True, many=False)

    child_object_content_type_model = serializers.SerializerMethodField(read_only=True)

    # number of related comments
    num_related_comments = serializers.IntegerField(read_only=True)

    # number of all relations (links)
    num_relations = serializers.IntegerField(read_only=True)

    lab_book_id = serializers.PrimaryKeyRelatedField(
        # ToDo: We should also provide LabBook.objects.viewable() here
        queryset=LabBook.objects.all(),
        source="lab_book",
        many=False,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = LabBookChildElement
        fields = (
            "pk",
            "lab_book_id",
            "position_x",
            "position_y",
            "width",
            "height",
            "child_object",
            "num_related_comments",
            "num_relations",
            "child_object_content_type",
            "child_object_id",
            "child_object_content_type_model",
        )

    def get_child_object_content_type_model(self, instance):
        if instance.child_object_id is None:
            logger.error(f"LabBook: Trying to access a deleted content object - LabBookChildElement.pk = {instance.pk}")
            return "deleted.deleted"

        return "{app_label}.{model}".format(
            app_label=instance.child_object_content_type.app_label,
            model=instance.child_object_content_type.model,
        )


class LabBookSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """Serializer for LabBook"""

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    class Meta:
        model = LabBook
        fields = (
            "title",
            "description",
            "is_template",
            "projects",
            "url",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "version_number",
            "metadata",
            "is_favourite",
        )

    @transaction.atomic
    def create(self, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        instance = super().create(validated_data)
        self.create_metadata(metadata_list, instance)
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        self.update_metadata(metadata_list, instance)
        return super().update(instance, validated_data)


class MinimalLabBookSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """

    class Meta:
        model = LabBook
        fields = (
            "pk",
            "title",
        )


class DetailedLabBookChildElementSerializer(BaseModelSerializer):
    lab_book = MinimalLabBookSerializer()

    class Meta:
        model = LabBookChildElement
        fields = (
            "pk",
            "display",
            "content_type_model",
            "content_type",
            "lab_book",
        )


class LabBookChildElementPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    A LabBookChildElement primary key related field used in the LabbookSectionSerializer
    """

    def get_queryset(self):
        # return all viewable LabBookChildElements here
        return LabBookChildElement.objects.viewable()


class LabbookSectionSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer):
    """Serializer for LabbookSections"""

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)
    child_elements = LabBookChildElementPrimaryKeyRelatedField(many=True, required=False)

    class Meta:
        model = LabbookSection
        fields = (
            "title",
            "date",
            "projects",
            "child_elements",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "version_number",
            "url",
        )
