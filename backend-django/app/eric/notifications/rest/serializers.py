from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from rest_framework import serializers
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.fields import SerializerMethodField

from eric.core.rest.serializers import BaseModelSerializer, PublicUserSerializer
from eric.notifications.models import NotificationConfiguration, Notification, ScheduledNotification


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


class ScheduledNotificationSerializer(BaseModelSerializer):
    options = serializers.SerializerMethodField()

    def validate_timedelta_value(self, value):
        """
        make sure that the timedelta_value is a positive integer
        """
        try:
            val = int(value)
            if val < 0:
                raise serializers.ValidationError(_("Value must be a positive integer"))
            else:
                return value
        except:
            raise serializers.ValidationError(_("Value must be a positive integer"))

    @staticmethod
    def get_scheduled_notification(meeting):
        try:
            instance = ScheduledNotification.objects.get(object_id=meeting.pk)
            instance.options = ScheduledNotification.SCHEDULEDNOTIFICATION_TIME_UNIT_CHOICES
            serializer = ScheduledNotificationSerializer(instance)
            return serializer.data
        except ScheduledNotification.DoesNotExist:
            return None

    def get_options(self, instance):
        options = []
        for value, text in ScheduledNotification.SCHEDULEDNOTIFICATION_TIME_UNIT_CHOICES:
            options.append({'text': text, 'value': value})
        return options

    class Meta:
        model = ScheduledNotification
        fields = (
            'scheduled_date_time', 'timedelta_value', 'timedelta_unit', 'content_type', 'object_id',
            'active', 'processed', 'deleted', 'options',
        )
        # Validators need to be turned off for object_id in order to allow updating this nested serializer (nested in
        # MeetingSerializer),
        # scheduled_date_time is calculated from timedelta_value/timedelta_unit and is not a required field
        extra_kwargs = {
            'object_id': {'validators': []},
            'scheduled_date_time': {'required': False},
        }

    @staticmethod
    def update_or_create_schedulednotification(scheduled_notification, instance):
        timedelta_value = scheduled_notification['timedelta_value']
        timedelta_unit = scheduled_notification['timedelta_unit']

        scheduled_date_time = ScheduledNotification.calculate_scheduled_date_time(timedelta_unit,
                                                                                  timedelta_value,
                                                                                  instance.date_time_start
                                                                                  )

        now = timezone.now()

        # make sure that we are not scheduling a reminder that lies in the past
        if scheduled_date_time < now:
            raise serializers.ValidationError({
                'scheduled_notification_writable': {
                    'timedelta_value': [
                        _("Reminder lies in the past")
                    ]
                }
            })

        content_type_id = ContentType.objects.get_for_model(instance).pk

        ScheduledNotification.objects.update_or_create(object_id=instance.pk,
                                                       defaults={
                                                           'scheduled_date_time': scheduled_date_time,
                                                           'timedelta_value': timedelta_value,
                                                           'timedelta_unit': timedelta_unit,
                                                           'active': scheduled_notification['active'],
                                                           'content_type_id': content_type_id
                                                       })
