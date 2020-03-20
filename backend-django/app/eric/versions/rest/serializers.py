#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from eric.core.rest.serializers import BaseModelWithCreatedBySerializer
from eric.versions.models.models import Version


class VersionSerializer(BaseModelWithCreatedBySerializer):
    """ REST API serializer for version entities """

    # content_type_pk = content type of the related object
    # content_type (from BaseModelSerializer) = content type of the object itself
    #                                           (= versions.Version)
    content_type_pk = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.all(),
        source='content_type',
        many=False,
        required=True
    )

    class Meta:
        model = Version
        fields = (
            'number', 'summary', 'metadata', 'content_type_pk', 'object_id',
        )
