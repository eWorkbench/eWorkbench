#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ValidationError
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
    class Meta:
        model = ScheduledNotification
        fields = (
            'scheduled_date_time', 'timedelta_value', 'timedelta_unit',
            'content_type', 'object_id',
            'active', 'processed', 'deleted',
        )
        # Validators need to be turned off for object_id in order to allow updating this nested serializer (nested in
        # MeetingSerializer),
        # scheduled_date_time is calculated from timedelta_value/timedelta_unit and is not a required field
        extra_kwargs = {
            'object_id': {'validators': []},
            'scheduled_date_time': {'required': False},
        }

    def validate_timedelta_value(self, value):
        try:
            val = int(value)
        except ValueError:
            raise ValidationError(_("Value must be a positive integer"))

        if val < 0:
            raise ValidationError(_("Value must be a positive integer"))

        return value

    def validate_timedelta_unit(self, unit):
        valid_units = [unit[0] for unit in ScheduledNotification.TIME_UNIT_CHOICES]
        if unit not in valid_units:
            raise ValidationError(_("Invalid time unit"))

        return unit

    @staticmethod
    def get_scheduled_notification(meeting):
        try:
            instance = ScheduledNotification.objects.get(object_id=meeting.pk)
            instance.options = ScheduledNotification.TIME_UNIT_CHOICES
            serializer = ScheduledNotificationSerializer(instance)
            return serializer.data
        except ScheduledNotification.DoesNotExist:
            return None

    @staticmethod
    def update_or_create_schedulednotification(scheduled_notification, instance):
        timedelta_value = scheduled_notification.get('timedelta_value', None)
        timedelta_unit = scheduled_notification.get('timedelta_unit', None)

        if not timedelta_value:
            raise ValidationError({
                'remind_attendees': ValidationError(
                    _('Time delta value is required'),
                    code='invalid'
                )
            })

        if not timedelta_unit:
            raise ValidationError({
                'remind_attendees': ValidationError(
                    _('Time delta unit is required'),
                    code='invalid'
                )
            })

        scheduled_date_time = ScheduledNotification.calculate_scheduled_date_time(
            timedelta_unit, timedelta_value, instance.date_time_start
        )

        now = timezone.now()
        active = scheduled_notification.get('active', False)

        # Make sure that we are not scheduling a reminder that lies in the past.
        # Make also sure this will only be checked if the end time lies in the future.
        if active and instance.date_time_end > now > scheduled_date_time:
            raise ValidationError({
                'remind_attendees': ValidationError(
                    _('Reminder lies in the past'),
                    code='invalid'
                ),
            })

        content_type_id = ContentType.objects.get_for_model(instance).pk

        ScheduledNotification.objects.update_or_create(
            object_id=instance.pk,
            defaults={
                'scheduled_date_time': scheduled_date_time,
                'timedelta_value': timedelta_value,
                'timedelta_unit': timedelta_unit,
                'active': active,
                'content_type_id': content_type_id
            }
        )
