#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction

from rest_framework import serializers
from rest_framework.reverse import reverse

from django_userforeignkey.request import get_current_request

from eric.core.rest.serializers import (
    BaseModelWithCreatedByAndSoftDeleteSerializer,
    BaseModelWithCreatedBySerializer,
    PublicUserGroupSerializer,
    PublicUserSerializer,
)
from eric.jwt_auth.jwt_utils import build_expiring_jwt_url
from eric.metadata.rest.serializers import EntityMetadataSerializer, EntityMetadataSerializerMixin
from eric.projects.models import (
    Resource,
    ResourceBookingRuleBookableHours,
    ResourceBookingRuleBookingsPerUser,
    ResourceBookingRuleMaximumDuration,
    ResourceBookingRuleMaximumTimeBefore,
    ResourceBookingRuleMinimumDuration,
    ResourceBookingRuleMinimumTimeBefore,
    ResourceBookingRuleTimeBetween,
)
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField

User = get_user_model()


class ResourceBookingRuleMinimumDurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleMinimumDuration
        fields = (
            "id",
            "duration",
        )


class ResourceBookingRuleMaximumDurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleMaximumDuration
        fields = (
            "id",
            "duration",
        )


class ResourceBookingRuleBookableHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleBookableHours
        fields = (
            "id",
            "weekday",
            "time_start",
            "time_end",
            "full_day",
        )


class ResourceBookingRuleMinimumTimeBeforeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleMinimumTimeBefore
        fields = (
            "id",
            "duration",
        )


class ResourceBookingRuleMaximumTimeBeforeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleMaximumTimeBefore
        fields = (
            "id",
            "duration",
        )


class ResourceBookingRuleTimeBetweenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleTimeBetween
        fields = (
            "id",
            "duration",
        )


class ResourceBookingRuleBookingsPerUserSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=False, allow_null=True)

    class Meta:
        model = ResourceBookingRuleBookingsPerUser
        fields = (
            "id",
            "count",
            "unit",
        )


class MinimalisticResourceSerializer(BaseModelWithCreatedBySerializer):
    """Minimalistic Serializer for Resources"""

    class Meta:
        model = Resource
        fields = (
            "pk",
            "name",
            "type",
            "responsible_unit",
            "location",
            "contact",
            "created_by",
            "created_at",
            "is_favourite",
        )


class ResourceSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    class Meta:
        model = Resource
        fields = (
            "pk",
            "url",
            "name",
            "description",
            "type",
            "responsible_unit",
            "location",
            "contact",
            "terms_of_use_pdf",
            "projects",
            "general_usage_setting",
            "usage_setting_selected_user_groups",
            "usage_setting_selected_user_group_pks",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "version_number",
            "metadata",
            "download_terms_of_use",
            "booking_rule_minimum_duration",
            "booking_rule_maximum_duration",
            "booking_rule_bookable_hours",
            "booking_rule_minimum_time_before",
            "booking_rule_maximum_time_before",
            "booking_rule_time_between",
            "booking_rule_bookings_per_user",
            "is_favourite",
            "calendar_interval",
        )

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    usage_setting_selected_user_groups = PublicUserGroupSerializer(read_only=True, many=True)
    usage_setting_selected_user_group_pks = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(), source="usage_setting_selected_user_groups", many=True, required=False
    )

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    booking_rule_minimum_duration = ResourceBookingRuleMinimumDurationSerializer(required=False, allow_null=True)
    booking_rule_maximum_duration = ResourceBookingRuleMaximumDurationSerializer(required=False, allow_null=True)
    booking_rule_bookable_hours = ResourceBookingRuleBookableHoursSerializer(required=False, allow_null=True, many=True)
    booking_rule_minimum_time_before = ResourceBookingRuleMinimumTimeBeforeSerializer(required=False, allow_null=True)
    booking_rule_maximum_time_before = ResourceBookingRuleMaximumTimeBeforeSerializer(required=False, allow_null=True)
    booking_rule_time_between = ResourceBookingRuleTimeBetweenSerializer(required=False, allow_null=True)
    booking_rule_bookings_per_user = ResourceBookingRuleBookingsPerUserSerializer(
        required=False, allow_null=True, many=True
    )

    # provide a download link for the terms_of_use
    download_terms_of_use = serializers.SerializerMethodField(read_only=True)

    def validate(self, data):
        if hasattr(data, "booking_rule_bookable_hours"):
            for item in data["booking_rule_bookable_hours"]:
                if not item["full_day"]:
                    if item["time_start"] is None or item["time_end"] is None:
                        raise ValidationError("The Time start field and the Time end field is required")
        return data

    @staticmethod
    def get_download_terms_of_use(obj):
        """Builds a string for downloading the terms_of_use with a jwt token"""

        request = get_current_request()
        path = reverse("resource-terms-of-use-download", kwargs={"pk": obj.pk})

        return build_expiring_jwt_url(request, path)

    @transaction.atomic
    def create(self, validated_data):
        """
        Override create method of ResourceSerializer such that we can handle sub-serializers for
         - metadata
        :param validated_data: validated data of the serializer
        :return: Resource
        """
        booking_rule_minimum_duration = None
        booking_rule_maximum_duration = None
        booking_rule_minimum_time_before = None
        booking_rule_maximum_time_before = None
        booking_rule_time_between = None
        booking_rule_bookings_per_user = None
        booking_rule_bookable_hours = None

        metadata_list = self.pop_metadata(validated_data)

        # get booking_rule_minimum_duration from validated data (if it is available)
        if "booking_rule_minimum_duration" in validated_data:
            booking_rule_minimum_duration = validated_data.pop("booking_rule_minimum_duration")

        # get booking_rule_maximum_duration from validated data (if it is available)
        if "booking_rule_maximum_duration" in validated_data:
            booking_rule_maximum_duration = validated_data.pop("booking_rule_maximum_duration")

        # get booking_rule_minimum_time_before from validated data (if it is available)
        if "booking_rule_minimum_time_before" in validated_data:
            booking_rule_minimum_time_before = validated_data.pop("booking_rule_minimum_time_before")

        # get booking_rule_maximum_time_before from validated data (if it is available)
        if "booking_rule_maximum_time_before" in validated_data:
            booking_rule_maximum_time_before = validated_data.pop("booking_rule_maximum_time_before")

        # get booking_rule_time_between from validated data (if it is available)
        if "booking_rule_time_between" in validated_data:
            booking_rule_time_between = validated_data.pop("booking_rule_time_between")

        # get booking_rule_bookings_per_user from validated data (if it is available)
        if "booking_rule_bookings_per_user" in validated_data:
            booking_rule_bookings_per_user = validated_data.pop("booking_rule_bookings_per_user")

        # get booking_rule_bookable_hours from validated data (if it is available)
        if "booking_rule_bookable_hours" in validated_data:
            booking_rule_bookable_hours = validated_data.pop("booking_rule_bookable_hours")

        # create the resource using ResourceSerializer
        instance = super().create(validated_data)

        # create the booking rules and add them to the instance
        # now create booking_rule_minimum_duration
        if booking_rule_minimum_duration:
            ResourceBookingRuleMinimumDuration.objects.create(
                duration=booking_rule_minimum_duration["duration"], resource=instance
            )

        # now create booking_rule_maximum_duration
        if booking_rule_maximum_duration:
            ResourceBookingRuleMaximumDuration.objects.create(
                duration=booking_rule_maximum_duration["duration"], resource=instance
            )

        # now create booking_rule_minimum_time_before
        if booking_rule_minimum_time_before:
            ResourceBookingRuleMinimumTimeBefore.objects.create(
                duration=booking_rule_minimum_time_before["duration"], resource=instance
            )

        # now create booking_rule_maximum_time_before
        if booking_rule_maximum_time_before:
            ResourceBookingRuleMaximumTimeBefore.objects.create(
                duration=booking_rule_maximum_time_before["duration"], resource=instance
            )

        # now create booking_rule_time_between
        if booking_rule_time_between:
            ResourceBookingRuleTimeBetween.objects.create(
                duration=booking_rule_time_between["duration"], resource=instance
            )

        # now create booking_rule_bookings_per_user
        if booking_rule_bookings_per_user:
            for item in booking_rule_bookings_per_user:
                ResourceBookingRuleBookingsPerUser.objects.create(
                    count=item["count"], unit=item["unit"], resource=instance
                )

        # now create booking_rule_bookable_hours
        if booking_rule_bookable_hours:
            for item in booking_rule_bookable_hours:
                ResourceBookingRuleBookableHours.objects.create(
                    weekday=item["weekday"],
                    time_start=booking_rule_bookable_hours["time_start"],
                    time_end=booking_rule_bookable_hours["time_end"],
                    full_day=booking_rule_bookable_hours["full_day"],
                    resource=instance,
                )

        self.create_metadata(metadata_list, instance)

        # save instance again so we can trigger the changeset
        instance.save()

        return instance

    @staticmethod
    def handle_booking_rules_with_duration(instance, validated_data):
        """
        Handles the booking rules for all booking rules which only carry a duration field:
        - Minimum duration
        - Maximum duration
        - Time before next booking
        - Time between bookings
        :param instance: the instance that is being updated
        :param validated_data: validated data of the serializer
        :return: validated_data
        """
        if not validated_data:
            return validated_data

        booking_rules_instances_with_duration = [
            ("booking_rule_minimum_duration", ResourceBookingRuleMinimumDuration),
            ("booking_rule_maximum_duration", ResourceBookingRuleMaximumDuration),
            ("booking_rule_minimum_time_before", ResourceBookingRuleMinimumTimeBefore),
            ("booking_rule_maximum_time_before", ResourceBookingRuleMaximumTimeBefore),
            ("booking_rule_time_between", ResourceBookingRuleTimeBetween),
        ]

        for booking_rule_instance in booking_rules_instances_with_duration:
            booking_rule_criterion = booking_rule_instance[0]
            booking_rule_class = booking_rule_instance[1]

            if booking_rule_criterion in validated_data:
                booking_rule_data = validated_data.pop(booking_rule_criterion)

                try:
                    booking_rule = booking_rule_class.objects.get(resource__pk=instance.pk)

                    if booking_rule_data is None:
                        booking_rule.delete()
                    else:
                        booking_rule.duration = booking_rule_data["duration"]
                        booking_rule.save()
                except ObjectDoesNotExist:
                    if booking_rule_data is not None:
                        booking_rule_class.objects.create(duration=booking_rule_data["duration"], resource=instance)

        return validated_data

    @staticmethod
    def handle_booking_rules_for_bookable_hours(instance, validated_data):
        """
        Handles the booking rule for bookable hours of a resource
        :param instance: the instance that is being updated
        :param validated_data: validated data of the serializer
        :return: validated_data
        """
        if not validated_data or "booking_rule_bookable_hours" not in validated_data:
            return validated_data

        booking_rule_data_list = validated_data.pop("booking_rule_bookable_hours")

        ResourceBookingRuleBookableHours.objects.filter(resource__pk=instance.pk).delete()

        if booking_rule_data_list is not None:
            for booking_rule_data in booking_rule_data_list:
                new_booking_rule = ResourceBookingRuleBookableHours(
                    weekday=booking_rule_data["weekday"],
                    time_start=booking_rule_data["time_start"],
                    time_end=booking_rule_data["time_end"],
                    full_day=booking_rule_data["full_day"],
                    resource=instance,
                )
                new_booking_rule.clean()
                new_booking_rule.save()

        return validated_data

    @staticmethod
    def handle_booking_rules_for_bookings_per_user(instance, validated_data):
        """
        Handles the booking rule for bookings per user of a resource
        :param instance: the instance that is being updated
        :param validated_data: validated data of the serializer
        :return: validated_data
        """
        if not validated_data or "booking_rule_bookings_per_user" not in validated_data:
            return validated_data

        booking_rule_data_list = validated_data.pop("booking_rule_bookings_per_user")

        ResourceBookingRuleBookingsPerUser.objects.filter(resource__pk=instance.pk).delete()

        for booking_rule_data in booking_rule_data_list:
            new_booking_rule = ResourceBookingRuleBookingsPerUser(
                count=booking_rule_data["count"], unit=booking_rule_data["unit"], resource=instance
            )
            new_booking_rule.clean()
            new_booking_rule.save()

        return validated_data

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Override update method of ResourceSerializer such that we can handle sub-serializers for
        - metadata
        :param instance: the instance that is being updated
        :param validated_data: validated data of the serializer
        :return: Resource
        """
        metadata_list = self.pop_metadata(validated_data)

        validated_data = self.handle_booking_rules_with_duration(instance, validated_data)
        validated_data = self.handle_booking_rules_for_bookable_hours(instance, validated_data)
        validated_data = self.handle_booking_rules_for_bookings_per_user(instance, validated_data)

        self.update_metadata(metadata_list, instance)

        # update resource instance
        instance = super().update(instance, validated_data)

        return instance
