#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django_userforeignkey.request import get_current_request
from rest_framework import serializers
from rest_framework.reverse import reverse

from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer, \
    BaseModelWithCreatedBySerializer, PublicUserSerializer, PublicUserGroupSerializer
from eric.jwt_auth.jwt_utils import build_expiring_jwt_url
from eric.metadata.rest.serializers import EntityMetadataSerializerMixin, EntityMetadataSerializer
from eric.projects.models import Resource, ResourceBookingRuleMinimumDuration, \
    ResourceBookingRuleMaximumDuration, ResourceBookingRuleBookableHours, ResourceBookingRuleMinimumTimeBefore, \
    ResourceBookingRuleMaximumTimeBefore, ResourceBookingRuleTimeBetween, ResourceBookingRuleBookingsPerUser
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField

User = get_user_model()


class ResourceBookingRuleMinimumDurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleMinimumDuration
        fields = (
            'id',
            'duration',
        )


class ResourceBookingRuleMaximumDurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleMaximumDuration
        fields = (
            'id',
            'duration',
        )


class ResourceBookingRuleBookableHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleBookableHours
        fields = (
            'id',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
            'time_start',
            'time_end',
            'full_day',
        )


class ResourceBookingRuleMinimumTimeBeforeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleMinimumTimeBefore
        fields = (
            'id',
            'duration',
        )


class ResourceBookingRuleMaximumTimeBeforeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleMaximumTimeBefore
        fields = (
            'id',
            'duration',
        )


class ResourceBookingRuleTimeBetweenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceBookingRuleTimeBetween
        fields = (
            'id',
            'duration',
        )


class ResourceBookingRuleBookingsPerUserSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=False, allow_null=True)

    class Meta:
        model = ResourceBookingRuleBookingsPerUser
        fields = (
            'id',
            'count',
            'unit',
        )


class MinimalisticResourceSerializer(BaseModelWithCreatedBySerializer):
    """ Minimalistic Serializer for Resources """

    class Meta:
        model = Resource
        fields = (
            'pk',
            'name',
            'type',
            'responsible_unit',
            'location',
            'contact',
            'created_by',
            'created_at',
        )


class ResourceSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    class Meta:
        model = Resource
        fields = (
            'pk',
            'url',
            'name',
            'description',
            'type',
            'responsible_unit',
            'location',
            'contact',
            'terms_of_use_pdf',
            'projects',
            'user_availability',
            'user_availability_selected_users',
            'user_availability_selected_user_pks',
            'user_availability_selected_user_groups',
            'user_availability_selected_user_group_pks',
            'created_by',
            'created_at',
            'last_modified_by',
            'last_modified_at',
            'version_number',
            'metadata',
            'download_terms_of_use',
            'booking_rule_minimum_duration',
            'booking_rule_maximum_duration',
            'booking_rule_bookable_hours',
            'booking_rule_minimum_time_before',
            'booking_rule_maximum_time_before',
            'booking_rule_time_between',
            'booking_rule_bookings_per_user',
            'is_favourite',
            'calendar_interval',
        )

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    user_availability_selected_users = PublicUserSerializer(read_only=True, many=True)
    user_availability_selected_user_pks = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user_availability_selected_users',
        many=True,
        required=False
    )

    user_availability_selected_user_groups = PublicUserGroupSerializer(read_only=True, many=True)
    user_availability_selected_user_group_pks = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        source='user_availability_selected_user_groups',
        many=True,
        required=False
    )

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    booking_rule_minimum_duration = ResourceBookingRuleMinimumDurationSerializer(required=False, allow_null=True)
    booking_rule_maximum_duration = ResourceBookingRuleMaximumDurationSerializer(required=False, allow_null=True)
    booking_rule_bookable_hours = ResourceBookingRuleBookableHoursSerializer(required=False, allow_null=True)
    booking_rule_minimum_time_before = ResourceBookingRuleMinimumTimeBeforeSerializer(required=False, allow_null=True)
    booking_rule_maximum_time_before = ResourceBookingRuleMaximumTimeBeforeSerializer(required=False, allow_null=True)
    booking_rule_time_between = ResourceBookingRuleTimeBetweenSerializer(required=False, allow_null=True)
    booking_rule_bookings_per_user = ResourceBookingRuleBookingsPerUserSerializer(
        required=False, allow_null=True, many=True
    )

    # provide a download link for the terms_of_use
    download_terms_of_use = serializers.SerializerMethodField(
        read_only=True
    )

    @staticmethod
    def get_download_terms_of_use(obj):
        """ Builds a string for downloading the terms_of_use with a jwt token """

        request = get_current_request()
        path = reverse('resource-terms-of-use-download', kwargs={'pk': obj.pk})

        return build_expiring_jwt_url(request, path)

    @transaction.atomic
    def create(self, validated_data):
        """
        Override create method of ResourceSerializer such that we can handle sub-serializers for
         - user_availability_selected_users
         - metadata
        :param validated_data: validated data of the serializer
        :return: Resource
        """
        user_availability_selected_users = None
        user_availability_selected_user_groups = None
        booking_rule_minimum_duration = None
        booking_rule_maximum_duration = None
        booking_rule_minimum_time_before = None
        booking_rule_maximum_time_before = None
        booking_rule_time_between = None
        booking_rule_bookings_per_user = None
        booking_rule_bookable_hours = None

        metadata_list = self.pop_metadata(validated_data)

        # get user_availability_selected_users from validated data (if it is available)
        if 'user_availability_selected_users' in validated_data:
            user_availability_selected_users = validated_data.pop('user_availability_selected_users')

        # get user_availability_selected_user_groups from validated data (if it is available)
        if 'user_availability_selected_user_groups' in validated_data:
            user_availability_selected_user_groups = validated_data.pop('user_availability_selected_user_groups')

        # get booking_rule_minimum_duration from validated data (if it is available)
        if 'booking_rule_minimum_duration' in validated_data:
            booking_rule_minimum_duration = validated_data.pop('booking_rule_minimum_duration')

        # get booking_rule_maximum_duration from validated data (if it is available)
        if 'booking_rule_maximum_duration' in validated_data:
            booking_rule_maximum_duration = validated_data.pop('booking_rule_maximum_duration')

        # get booking_rule_minimum_time_before from validated data (if it is available)
        if 'booking_rule_minimum_time_before' in validated_data:
            booking_rule_minimum_time_before = validated_data.pop('booking_rule_minimum_time_before')

        # get booking_rule_maximum_time_before from validated data (if it is available)
        if 'booking_rule_maximum_time_before' in validated_data:
            booking_rule_maximum_time_before = validated_data.pop('booking_rule_maximum_time_before')

        # get booking_rule_time_between from validated data (if it is available)
        if 'booking_rule_time_between' in validated_data:
            booking_rule_time_between = validated_data.pop('booking_rule_time_between')

        # get booking_rule_bookings_per_user from validated data (if it is available)
        if 'booking_rule_bookings_per_user' in validated_data:
            booking_rule_bookings_per_user = validated_data.pop('booking_rule_bookings_per_user')

        # get booking_rule_bookable_hours from validated data (if it is available)
        if 'booking_rule_bookable_hours' in validated_data:
            booking_rule_bookable_hours = validated_data.pop('booking_rule_bookable_hours')

        # create the resource using ResourceSerializer
        instance = super(ResourceSerializer, self).create(validated_data)

        # now create user_availability_selected_users
        if user_availability_selected_users:
            for user in user_availability_selected_users:
                instance.user_availability_selected_users.add(user)

        # now create user_availability_selected_user_groups
        if user_availability_selected_user_groups:
            for user_group in user_availability_selected_user_groups:
                instance.user_availability_selected_user_groups.add(user_group)

        # create the booking rules and add them to the instance
        # now create booking_rule_minimum_duration
        if booking_rule_minimum_duration:
            ResourceBookingRuleMinimumDuration.objects.create(
                duration=booking_rule_minimum_duration['duration'],
                resource=instance
            )

        # now create booking_rule_maximum_duration
        if booking_rule_maximum_duration:
            ResourceBookingRuleMaximumDuration.objects.create(
                duration=booking_rule_maximum_duration['duration'],
                resource=instance
            )

        # now create booking_rule_minimum_time_before
        if booking_rule_minimum_time_before:
            ResourceBookingRuleMinimumTimeBefore.objects.create(
                duration=booking_rule_minimum_time_before['duration'],
                resource=instance
            )

        # now create booking_rule_maximum_time_before
        if booking_rule_maximum_time_before:
            ResourceBookingRuleMaximumTimeBefore.objects.create(
                duration=booking_rule_maximum_time_before['duration'],
                resource=instance
            )

        # now create booking_rule_time_between
        if booking_rule_time_between:
            ResourceBookingRuleTimeBetween.objects.create(
                duration=booking_rule_time_between['duration'],
                resource=instance
            )

        # now create booking_rule_bookings_per_user
        if booking_rule_bookings_per_user:
            for item in booking_rule_bookings_per_user:
                ResourceBookingRuleBookingsPerUser.objects.create(
                    count=item['count'],
                    unit=item['unit'],
                    resource=instance
                )

        # now create booking_rule_bookable_hours
        if booking_rule_bookable_hours:
            ResourceBookingRuleBookableHours.objects.create(
                monday=booking_rule_bookable_hours['monday'],
                tuesday=booking_rule_bookable_hours['tuesday'],
                wednesday=booking_rule_bookable_hours['wednesday'],
                thursday=booking_rule_bookable_hours['thursday'],
                friday=booking_rule_bookable_hours['friday'],
                saturday=booking_rule_bookable_hours['saturday'],
                sunday=booking_rule_bookable_hours['sunday'],
                time_start=booking_rule_bookable_hours['time_start'],
                time_end=booking_rule_bookable_hours['time_end'],
                full_day=booking_rule_bookable_hours['full_day'],
                resource=instance
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
            ('booking_rule_minimum_duration', ResourceBookingRuleMinimumDuration),
            ('booking_rule_maximum_duration', ResourceBookingRuleMaximumDuration),
            ('booking_rule_minimum_time_before', ResourceBookingRuleMinimumTimeBefore),
            ('booking_rule_maximum_time_before', ResourceBookingRuleMaximumTimeBefore),
            ('booking_rule_time_between', ResourceBookingRuleTimeBetween),
        ]

        for booking_rule_instance in booking_rules_instances_with_duration:
            booking_rule_criterion = booking_rule_instance[0]
            booking_rule_class = booking_rule_instance[1]

            if booking_rule_criterion in validated_data:
                booking_rule_data = validated_data.pop(booking_rule_criterion)

                try:
                    booking_rule = booking_rule_class.objects.get(
                        resource__pk=instance.pk
                    )

                    if booking_rule_data is None:
                        booking_rule.delete()
                    else:
                        booking_rule.duration = booking_rule_data['duration']
                        booking_rule.save()
                except ObjectDoesNotExist:
                    if booking_rule_data is not None:
                        booking_rule_class.objects.create(
                            duration=booking_rule_data['duration'],
                            resource=instance
                        )

        return validated_data

    @staticmethod
    def handle_booking_rules_for_bookable_hours(instance, validated_data):
        """
        Handles the booking rule for bookable hours of a resource
        :param instance: the instance that is being updated
        :param validated_data: validated data of the serializer
        :return: validated_data
        """
        if not validated_data or 'booking_rule_bookable_hours' not in validated_data:
            return validated_data

        booking_rule_data = validated_data.pop('booking_rule_bookable_hours')

        try:
            booking_rule = ResourceBookingRuleBookableHours.objects.get(
                resource__pk=instance.pk
            )

            if booking_rule_data is None:
                booking_rule.delete()
            else:
                booking_rule.monday = booking_rule_data['monday']
                booking_rule.tuesday = booking_rule_data['tuesday']
                booking_rule.wednesday = booking_rule_data['wednesday']
                booking_rule.thursday = booking_rule_data['thursday']
                booking_rule.friday = booking_rule_data['friday']
                booking_rule.saturday = booking_rule_data['saturday']
                booking_rule.sunday = booking_rule_data['sunday']
                booking_rule.time_start = booking_rule_data['time_start']
                booking_rule.time_end = booking_rule_data['time_end']
                booking_rule.full_day = booking_rule_data['full_day']
                booking_rule.save()
        except ObjectDoesNotExist:
            if booking_rule_data is not None:
                ResourceBookingRuleBookableHours.objects.create(
                    resource=instance,
                    **booking_rule_data
                )

        return validated_data

    @staticmethod
    def handle_booking_rules_for_bookings_per_user(instance, validated_data):
        """
        Handles the booking rule for bookings per user of a resource
        :param instance: the instance that is being updated
        :param validated_data: validated data of the serializer
        :return: validated_data
        """
        if not validated_data or 'booking_rule_bookings_per_user' not in validated_data:
            return validated_data

        booking_rule_data_list = validated_data.pop('booking_rule_bookings_per_user')

        ResourceBookingRuleBookingsPerUser.objects.filter(
            resource__pk=instance.pk
        ).delete()

        for booking_rule_data in booking_rule_data_list:
            new_booking_rule = ResourceBookingRuleBookingsPerUser(
                count=booking_rule_data['count'],
                unit=booking_rule_data['unit'],
                resource=instance
            )
            new_booking_rule.clean()
            new_booking_rule.save()

        return validated_data

    @staticmethod
    def update_user_availability_selected_users(instance, user_availability_selected_users):
        """
        Updates the user availability of selected users
        :param instance: the instance that is being updated
        :param user_availability_selected_users: selected users
        :return: instance
        """
        currently_selected_users = instance.user_availability_selected_users.all()
        users_to_remove = set(currently_selected_users).difference(user_availability_selected_users)
        users_to_add = set(user_availability_selected_users).difference(set(currently_selected_users))

        # handle user_availability_selected_users that need to be removed
        for user in users_to_remove:
            instance.user_availability_selected_users.remove(user)

        # handle user_availability_selected_users that need to be added
        for user in users_to_add:
            instance.user_availability_selected_users.add(user)

        return instance

    @staticmethod
    def update_user_availability_selected_user_groups(instance, user_availability_selected_user_groups):
        """
        Updates the user availability of selected user groups
        :param instance: the instance that is being updated
        :param user_availability_selected_user_groups: selected user groups
        :return: instance
        """
        currently_selected_user_groups = instance.user_availability_selected_user_groups.all()
        user_groups_to_remove = set(currently_selected_user_groups).difference(user_availability_selected_user_groups)
        user_groups_to_add = set(user_availability_selected_user_groups).difference(set(currently_selected_user_groups))

        # handle user_availability_selected_user_groups that need to be removed
        for user_group in user_groups_to_remove:
            instance.user_availability_selected_user_groups.remove(user_group)

        # handle user_availability_selected_user_groups that need to be added
        for user_group in user_groups_to_add:
            instance.user_availability_selected_user_groups.add(user_group)

        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Override update method of ResourceSerializer such that we can handle sub-serializers for
        - user_availability_selected_users
        - metadata
        :param instance: the instance that is being updated
        :param validated_data: validated data of the serializer
        :return: Resource
        """
        metadata_list = self.pop_metadata(validated_data)

        validated_data = self.handle_booking_rules_with_duration(instance, validated_data)
        validated_data = self.handle_booking_rules_for_bookable_hours(instance, validated_data)
        validated_data = self.handle_booking_rules_for_bookings_per_user(instance, validated_data)

        if 'user_availability_selected_users' in validated_data:
            user_availability_selected_users = validated_data.pop('user_availability_selected_users')
            instance = self.update_user_availability_selected_users(instance, user_availability_selected_users)

        # get user_availability_selected_user_groups from validated data (if it is available)
        if 'user_availability_selected_user_groups' in validated_data:
            user_availability_selected_user_groups = validated_data.pop('user_availability_selected_user_groups')
            instance = self.update_user_availability_selected_user_groups(
                instance,
                user_availability_selected_user_groups
            )

        self.update_metadata(metadata_list, instance)

        # update resource instance
        instance = super(ResourceSerializer, self).update(instance, validated_data)

        return instance
