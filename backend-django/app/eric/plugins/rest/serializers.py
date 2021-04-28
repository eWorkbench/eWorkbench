#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import urllib
from datetime import timedelta
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.urls import reverse
from django_userforeignkey.request import get_current_request, get_current_user
from rest_framework import serializers

from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer, PublicUserSerializer
from eric.jwt_auth.jwt_utils import build_expiring_jwt_url, build_expiring_jwt_token
from eric.metadata.rest.serializers import EntityMetadataSerializerMixin, EntityMetadataSerializer
from eric.plugins.models.models import Plugin, PluginInstance

User = get_user_model()


class PluginSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """ REST API Serializer for Plugins """

    responsible_users = PublicUserSerializer(read_only=True, many=True)
    download_placeholder_picture = serializers.SerializerMethodField(read_only=True)
    is_accessible = serializers.SerializerMethodField(read_only=True)

    responsible_users_pk = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='responsible_users',
        many=True,
        required=False
    )

    def get_is_accessible(self, instance):
        return Plugin.objects.viewable().filter(pk=instance.pk).exists()

    def get_download_placeholder_picture(self, instance):
        url_with_token = self.build_download_url_with_token(instance, reverse_url_name='plugin-placeholder-picture')
        return f'{url_with_token}'

    @staticmethod
    def build_download_url_with_token(plugin, reverse_url_name):
        request = get_current_request()
        path = reverse(reverse_url_name, kwargs={'pk': plugin.pk})

        return build_expiring_jwt_url(request, path)

    class Meta:
        model = Plugin
        fields = (
            'pk',
            'url',
            'title',
            'short_description',
            'long_description',
            'logo',
            'responsible_users',
            'responsible_users_pk',
            'path',
            'is_accessible',
            'download_placeholder_picture',
            'placeholder_picture_mime_type',
        )
        read_only_fields = ('responsible_users', 'is_accessible', 'placeholder_picture_mime_type',)


class PluginInstanceSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """ REST API Serializer for Plugin Instances """

    download_rawdata = serializers.SerializerMethodField(read_only=True)
    download_picture = serializers.SerializerMethodField(read_only=True)
    auth_url = serializers.SerializerMethodField(read_only=True)

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    plugin_details = PluginSerializer(
        read_only=True,
        many=False,
        source='plugin',
    )

    def get_download_rawdata(self, plugin_instance):
        if not plugin_instance.rawdata:
            return None

        return self.build_download_url_with_token(plugin_instance, reverse_url_name='plugininstance-rawdata')

    def get_download_picture(self, plugin_instance):
        if not plugin_instance.picture:
            return None

        return self.build_download_url_with_token(plugin_instance, reverse_url_name='plugininstance-picture')

    @staticmethod
    def build_download_url_with_token(plugin_instance, reverse_url_name):
        request = get_current_request()
        path = reverse(reverse_url_name, kwargs={'pk': plugin_instance.pk})
        return build_expiring_jwt_url(request, path)

    def get_auth_url(self, plugin_instance):
        user = get_current_user()
        path = reverse('plugininstance-detail', kwargs={'pk': plugin_instance.pk})
        plugin_token_validity = timedelta(hours=settings.PLUGINS_SETTINGS['plugin_api_token_validity_in_hours'])
        token = build_expiring_jwt_token(user, path, validity=plugin_token_validity)

        api_base_url = get_current_request().build_absolute_uri('/api/plugininstances/')

        # add or replace existing parameters from the plugin path
        query = "jwt={token}&pk={pk}&apiBaseUrl={apiBaseUrl}".format(
            token=token,
            pk=plugin_instance.pk,
            apiBaseUrl=urllib.parse.quote(api_base_url, safe='')
        )
        old_path_parts = urlparse(plugin_instance.plugin.path)
        new_path_parts = old_path_parts._replace(query=query)

        return new_path_parts.geturl()

    class Meta:
        model = PluginInstance
        fields = (
            'pk', 'url', 'title', 'plugin', 'auth_url',
            'rawdata', 'download_rawdata', 'rawdata_mime_type', 'rawdata_size', 'picture', 'picture_mime_type',
            'picture_size', 'download_picture', 'projects', 'version_number', 'metadata', 'plugin_details',
            'is_favourite'
        )
        read_only_fields = ('plugin_details', 'rawdata_mime_type', 'rawdata_size', 'picture_mime_type', 'picture_size',)

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


class PluginFeedbackSerializer(serializers.Serializer):
    """ Serializer for sending feedback/access request for a plugin """
    subject = serializers.CharField(allow_blank=True)
    message = serializers.CharField(allow_blank=True)
