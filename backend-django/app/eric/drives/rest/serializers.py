#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import jwt
import re
from django.conf import settings
from django.db import transaction
from django.utils.timezone import datetime, timedelta
from django_userforeignkey.request import get_current_request
from rest_framework import serializers
from rest_framework.reverse import reverse
from rest_framework_nested.relations import NestedHyperlinkedIdentityField

from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer, HyperlinkedToListField
from eric.drives.models import Drive
from eric.drives.models.models import Directory
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
        """
        Builds a string for downloading the directory with a jwt token
        :param obj:
        :return:
        """
        request = get_current_request()

        # get the current request path/url
        path = reverse('drive-sub_directories-download', kwargs={'drive_pk': obj.drive.pk, 'pk': obj.pk})

        # build an absolute URL for the given apth
        absolute_url = request.build_absolute_uri(path)

        # the token should contain the following information
        payload = {
            'exp': datetime.now() + timedelta(
                hours=settings.WORKBENCH_SETTINGS['download_token_validity_in_hours']
            ),  # expiration time
            # store pk and object type that this object relates to
            'pk': str(obj.pk),
            'object_type': obj.__class__.__name__,
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

    class Meta:
        model = Directory
        fields = (
            'name', 'directory', 'drive_id', 'url', 'download_directory', 'is_virtual_root',
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

    webdav_url = serializers.SerializerMethodField()

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    class Meta:
        model = Drive
        fields = (
            'title', 'projects', 'sub_directories', 'sub_directories_url',
            'created_by', 'created_at', 'last_modified_by', 'last_modified_at', 'version_number',
            'url', 'webdav_url', 'metadata',
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

        return reverse(
            'webdav-drive',
            request=request,
            kwargs={'drive': obj.pk, 'path': '/', 'drive_title': stripped_title}
        )

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
