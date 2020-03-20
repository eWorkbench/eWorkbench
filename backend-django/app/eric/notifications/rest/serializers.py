#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.fields import SerializerMethodField

from eric.core.rest.serializers import BaseModelSerializer, PublicUserSerializer
from eric.notifications.models import NotificationConfiguration, Notification


class NotificationConfigurationSerializer(BaseModelSerializer):
    """Serializer for Notification Configuration"""

    class Meta:
        model = NotificationConfiguration
        fields = (
            'allowed_notifications',
        )


class NotificationSerializer(BaseModelSerializer):
    """Serializer for Notification"""

    content_type_model = SerializerMethodField()

    created_by = PublicUserSerializer(
        read_only=True
    )

    last_modified_by = PublicUserSerializer(
        read_only=True
    )

    def get_content_type_model(self, instance):
        if hasattr(instance, 'content_type'):
            return "%(app_label)s.%(model)s" % {
                'app_label': instance.content_type.app_label,
                'model': instance.content_type.model
            }

        return None

    class Meta:
        model = Notification
        fields = (
            'title', 'message', 'read', 'content_type_model', 'object_id',
            'created_at', 'created_by', 'last_modified_at', 'last_modified_by',
        )
