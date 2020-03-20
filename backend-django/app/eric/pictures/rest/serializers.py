#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import jwt
from django.conf import settings
from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils.timezone import datetime, timedelta
from django_userforeignkey.request import get_current_request
from rest_framework import serializers

from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.metadata.rest.serializers import EntityMetadataSerializerMixin, EntityMetadataSerializer
from eric.pictures.models import Picture
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField


class PictureSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """ REST API Serializer for Picture """

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
        return self.build_download_url(picture, 'picture-shapes-json')

    def get_download_background_image(self, picture):
        return self.build_download_url_with_token(picture, 'picture-background-image')

    def get_download_rendered_image(self, picture):
        if not picture.rendered_image:
            return self.get_download_background_image(picture)

        return self.build_download_url_with_token(picture, 'picture-rendered-image')

    @staticmethod
    def build_download_url_with_token(picture, reverse_url_name):
        request = get_current_request()

        if picture.uploaded_picture_entry is None:
            raise IntegrityError("uploaded_picture_entry is not referenced")

        path = reverse(reverse_url_name, kwargs={'pk': picture.uploaded_picture_entry.pk})
        absolute_url = request.build_absolute_uri(path)

        # the token should contain the following information
        payload = {
            'exp': datetime.now() + timedelta(
                hours=settings.WORKBENCH_SETTINGS['download_token_validity_in_hours']
            ),  # expiration time
            # store pk and object type that this object relates to
            'pk': str(picture.pk),
            'object_type': picture.__class__.__name__,
            # store the users primary key
            'user': request.user.pk,
            # store the verification token, so the token can be revoked afterwards
            'jwt_verification_token': request.user.userprofile.jwt_verification_token,
            # store the path that this token is valid for
            'path': path
        }

        # generate JWT with the payload and the secret key
        jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        return "{absolute_url}?jwt={token}".format(
            absolute_url=absolute_url,
            token=jwt_token.decode("utf-8")
        )

    @staticmethod
    def build_download_url(picture, reverse_url_name):
        request = get_current_request()
        path = reverse(reverse_url_name, kwargs={'pk': picture.uploaded_picture_entry.pk})
        return request.build_absolute_uri(path)

    # all files should be write only - we have the download links as alternative

    # write only for the shapes
    shapes_image = serializers.FileField(write_only=True, required=False)

    # write only for the background image
    background_image = serializers.FileField(write_only=True, required=False)

    # write only for the rendered image
    rendered_image = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Picture
        fields = (
            'title', 'shapes_image', 'background_image', 'rendered_image', 'projects', 'width', 'height',
            'created_by', 'created_at', 'last_modified_by', 'last_modified_at', 'version_number',
            'download_shapes', 'download_background_image', 'download_rendered_image',
            'url', 'metadata',
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
