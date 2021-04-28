#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import re

from django.db import transaction
from django_userforeignkey.request import get_current_request
from rest_framework import serializers
from rest_framework.reverse import reverse
from rest_framework_nested.relations import NestedHyperlinkedIdentityField

from eric.jwt_auth.jwt_utils import build_expiring_jwt_url
from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer, HyperlinkedToListField
from eric.drives.models import Drive
from eric.drives.models.models import Directory
from eric.dss.models import DSSEnvelope, DSSContainer
from eric.metadata.rest.serializers import EntityMetadataSerializerMixin, EntityMetadataSerializer
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField


class DirectorySerializer(BaseModelWithCreatedByAndSoftDeleteSerializer):
    """ REST API Serializer for Directories """

    drive_id = serializers.PrimaryKeyRelatedField(
        # ToDo: We should also provide Drive.objects.viewable() here
        queryset=Drive.objects.all(),
        source='drive',
        many=False,
        required=False,
        allow_null=True
    )

    url = NestedHyperlinkedIdentityField(
        view_name='drive-sub_directories-detail',
        parent_lookup_kwargs={'drive_pk': 'drive__pk'},
        lookup_url_kwarg='pk',
        lookup_field='pk'
    )

    # provide a download link for the background image
    download_directory = serializers.SerializerMethodField(
        read_only=True
    )

    def get_download_directory(self, obj):
        """ Builds a string for downloading the directory with a jwt token """
        request = get_current_request()

        path = reverse('drive-sub_directories-download', kwargs={
            'drive_pk': obj.drive.pk,
            'pk': obj.pk
        })

        return build_expiring_jwt_url(request, path)

    class Meta:
        model = Directory
        fields = (
            'name', 'directory', 'drive_id', 'url', 'download_directory', 'is_virtual_root', 'imported',
        )
        read_only_fields = (
            'is_virtual_root',
        )


class DriveSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """ REST API Serializer for Drive """

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    sub_directories = DirectorySerializer(many=True, required=False, read_only=True)

    # url for file-list
    sub_directories_url = HyperlinkedToListField(
        view_name="drive-sub_directories-list",
        lookup_field_name='drive_pk'
    )

    dss_envelope_id = serializers.PrimaryKeyRelatedField(
        queryset=DSSEnvelope.objects.all(),
        source='envelope',
        many=False,
        required=False,
        allow_null=True
    )

    envelope_path = serializers.StringRelatedField(
        source='envelope',
        many=False,
        required=False,
        allow_null=True
    )

    container_id = serializers.PrimaryKeyRelatedField(
        queryset=DSSContainer.objects.all(),
        source='envelope.container',
        many=False,
        required=False,
        allow_null=True
    )

    webdav_url = serializers.SerializerMethodField()

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    class Meta:
        model = Drive
        fields = (
            'title', 'projects', 'sub_directories', 'sub_directories_url', 'container_id', 'location',
            'is_dss_drive', 'envelope_path', 'dss_envelope_id',
            'created_by', 'created_at', 'last_modified_by', 'last_modified_at', 'version_number',
            'url', 'webdav_url', 'metadata', 'imported', 'is_favourite'
        )

    def get_webdav_url(self, obj):
        """
        Returns the webdav URL for the current drive
        :param obj:
        :return:
        """
        request = get_current_request()

        # strip all non-confirming characters from drive title
        pat = re.compile(r'[\W \-]+')

        stripped_title = re.sub(pat, ' ', obj.title)

        # temporarily remove webdav_url for DSS drives
        if not obj.is_dss_drive:
            return reverse(
                'webdav-drive',
                request=request,
                kwargs={'drive': obj.pk, 'path': '/', 'drive_title': stripped_title}
            )
        return None

    @transaction.atomic
    def create(self, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        instance = super(DriveSerializer, self).create(validated_data)
        self.create_metadata(metadata_list, instance)
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        self.update_metadata(metadata_list, instance)
        return super(DriveSerializer, self).update(instance, validated_data)
