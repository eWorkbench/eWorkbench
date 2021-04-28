#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.db import transaction
from django.urls import reverse
from django_userforeignkey.request import get_current_request
from rest_framework import serializers

from eric.core.rest.serializers import BaseModelWithCreatedBySerializer, BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.dss.models import DSSEnvelope, DSSContainer
from eric.metadata.rest.serializers import EntityMetadataSerializerMixin, EntityMetadataSerializer
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField
from eric.shared_elements.models import File, UploadedFileEntry

User = get_user_model()


class UploadedFileEntrySerializer(BaseModelWithCreatedBySerializer):
    """ REST API Serializer for Uploaded File Entries """

    class Meta:
        model = UploadedFileEntry
        fields = ('mime_type', 'original_filename', 'created_by', 'created_at', 'file_size')
        read_only_fields = ('mime_type', 'original_filename', 'file_size')


class FileSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """ REST API Serializer for Files """
    from eric.drives.models import Directory

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    download = serializers.SerializerMethodField(read_only=True)

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    def get_download(self, file):
        request = get_current_request()
        path = reverse("file-download", kwargs={'pk': file.uploaded_file_entry.pk})
        return request.build_absolute_uri(path)

    directory_id = serializers.PrimaryKeyRelatedField(
        # ToDo: We should also provide Directory.objects.viewable() here
        queryset=Directory.objects.all(),
        source='directory',
        many=False,
        required=False,
        allow_null=True
    )

    envelope_id = serializers.PrimaryKeyRelatedField(
        source='directory.drive.envelope',
        many=False,
        required=False,
        allow_null=True,
        read_only=True
    )

    container_id = serializers.PrimaryKeyRelatedField(
        source='directory.drive.envelope.container',
        many=False,
        required=False,
        allow_null=True,
        read_only=True
    )

    path = serializers.FileField(write_only=True, allow_empty_file=True)

    class Meta:
        model = File
        fields = (
            'title', 'name', 'description', 'path', 'original_filename', 'mime_type', 'projects', 'url',
            'download', 'file_size', 'directory_id', 'envelope_id', 'container_id', 'is_dss_file', 'location',
            'created_by', 'created_at', 'last_modified_by', 'last_modified_at', 'version_number',
            'metadata', 'imported', 'is_favourite'
        )
        read_only_fields = ('original_filename', 'mime_type', 'file_size', 'mime_type')

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
