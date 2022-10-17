#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import IntegrityError, transaction
from django.urls import reverse

from rest_framework import serializers

from django_userforeignkey.request import get_current_request

from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.jwt_auth.jwt_utils import build_expiring_jwt_url
from eric.labbooks.rest.serializers import DetailedLabBookChildElementSerializer
from eric.metadata.rest.serializers import EntityMetadataSerializer, EntityMetadataSerializerMixin
from eric.pictures.models import Picture
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField


class PictureSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """REST API Serializer for Picture"""

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    download_shapes = serializers.SerializerMethodField(read_only=True)
    download_background_image = serializers.SerializerMethodField(read_only=True)
    download_rendered_image = serializers.SerializerMethodField(read_only=True)

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    def get_download_shapes(self, picture):
        return self.build_download_url(picture, "picture-shapes-json")

    def get_download_background_image(self, picture):
        return self.build_download_url_with_token(picture, "picture-background-image")

    def get_download_rendered_image(self, picture):
        if not picture.rendered_image:
            return self.get_download_background_image(picture)

        return self.build_download_url_with_token(picture, "picture-rendered-image")

    @staticmethod
    def build_download_url_with_token(picture, reverse_url_name):
        request = get_current_request()

        if picture.uploaded_picture_entry is None:
            raise IntegrityError("uploaded_picture_entry is not referenced")

        path = reverse(reverse_url_name, kwargs={"pk": picture.uploaded_picture_entry.pk})

        return build_expiring_jwt_url(request, path)

    @staticmethod
    def build_download_url(picture, reverse_url_name):
        request = get_current_request()
        path = reverse(reverse_url_name, kwargs={"pk": picture.uploaded_picture_entry.pk})
        return request.build_absolute_uri(path)

    # all files should be write only - we have the download links as alternative

    # write only for the shapes
    shapes_image = serializers.FileField(write_only=True, required=False)

    # write only for the background image
    background_image = serializers.FileField(write_only=True, required=False)

    # write only for the rendered image
    rendered_image = serializers.FileField(write_only=True, required=False)

    labbook_container = DetailedLabBookChildElementSerializer(
        read_only=True,
        many=False,
    )

    class Meta:
        model = Picture
        fields = (
            "title",
            "shapes_image",
            "background_image",
            "rendered_image",
            "projects",
            "width",
            "height",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "version_number",
            "download_shapes",
            "download_background_image",
            "download_rendered_image",
            "labbook_container",
            "url",
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
