#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework.fields import SerializerMethodField

from eric.core.rest.serializers import BaseModelWithCreatedBySerializer, PublicUserSerializer, \
    BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.metadata.rest.serializers import EntityMetadataSerializerMixin, EntityMetadataSerializer
from eric.notifications.rest.serializers import ScheduledNotificationSerializer
from eric.projects.models import Resource
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField
from eric.projects.rest.serializers.resource import MinimalisticResourceSerializer
from eric.shared_elements.models import Meeting, Contact, ContactAttendsMeeting, UserAttendsMeeting
from eric.shared_elements.rest.serializers.contact import MinimalisticContactSerializer

User = get_user_model()


class ContactPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    A special contact primary key related field, which only displays the Contacts that are viewable by the current user
    """

    def get_queryset(self):
        return Contact.objects.viewable()


class MinimalisticMeetingSerializer(BaseModelWithCreatedBySerializer):
    resource = MinimalisticResourceSerializer(read_only=True)

    attending_users = PublicUserSerializer(read_only=True, many=True)

    attending_contacts = MinimalisticContactSerializer(read_only=True, many=True)

    class Meta:
        model = Meeting
        fields = (
            'title', 'date_time_start', 'date_time_end', 'resource', 'attending_users', 'attending_contacts',
            'created_by', 'created_at', 'last_modified_by', 'last_modified_at'
        )


class MeetingSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin,
                        ScheduledNotificationSerializer):
    """ Serializer for Meetings """

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    resource = MinimalisticResourceSerializer(read_only=True)

    resource_pk = serializers.PrimaryKeyRelatedField(
        queryset=Resource.objects.all(),
        source='resource',
        many=False,
        required=False,
        allow_null=True
    )

    attending_users = PublicUserSerializer(read_only=True, many=True)

    attending_users_pk = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='attending_users',
        many=True,
        required=False
    )

    attending_contacts = MinimalisticContactSerializer(read_only=True, many=True)

    attending_contacts_pk = ContactPrimaryKeyRelatedField(
        source='attending_contacts',
        many=True,
        required=False
    )

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    scheduled_notification = SerializerMethodField()

    def get_scheduled_notification(self, instance):
        return ScheduledNotificationSerializer.get_scheduled_notification(instance)

    # a separate named field is required for writing to ScheduledNotification
    scheduled_notification_writable = ScheduledNotificationSerializer(write_only=True, required=False)

    class Meta:
        model = Meeting
        fields = (
            'title', 'location', 'date_time_start', 'date_time_end', 'text', 'projects',
            'url', 'resource', 'resource_pk',
            'attending_users', 'attending_contacts',
            'attending_contacts_pk', 'attending_users_pk',
            'created_by', 'created_at', 'last_modified_by', 'last_modified_at', 'version_number',
            'metadata', 'scheduled_notification', 'scheduled_notification_writable',
        )

    @transaction.atomic
    def create(self, validated_data):
        """
        Create a meeting with attending users and attending contacts
        :param validated_data:
        :return:
        """
        attending_users = None
        attending_contacts = None
        scheduled_notification_writable = None

        if 'attending_users' in validated_data:
            attending_users = validated_data.pop('attending_users')
        if 'attending_contacts' in validated_data:
            attending_contacts = validated_data.pop('attending_contacts')

        if 'scheduled_notification_writable' in validated_data:
            scheduled_notification_writable = validated_data.pop('scheduled_notification_writable')

        metadata_list = self.pop_metadata(validated_data)

        # delegate creating the meeting to the current serializer
        instance = super(MeetingSerializer, self).create(validated_data)

        # read the request data and add the value of create_for to the instance, which is the pk of a user
        # in the MeetingViewSet we will use it to change attending_users accordingly and to give full access privilege
        request = self.context['request']
        instance.create_for = request.data.get('create_for')

        # create attending users
        if attending_users:
            for user in attending_users:
                UserAttendsMeeting.objects.create(user=user, meeting=instance)

        # create attending contacts
        if attending_contacts:
            for contact in attending_contacts:
                ContactAttendsMeeting.objects.create(contact=contact, meeting=instance)

        self.create_metadata(metadata_list, instance)

        if scheduled_notification_writable:
            self.update_or_create_schedulednotification(scheduled_notification_writable, instance)

        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Update a meeting with attending users and attending contacts
        :param instance:
        :param validated_data:
        :return:
        """
        attending_contacts = None
        attending_users = None
        scheduled_notification_writable = None

        if 'attending_contacts' in validated_data:
            attending_contacts = validated_data.pop('attending_contacts')

        if 'attending_users' in validated_data:
            attending_users = validated_data.pop('attending_users')

        if 'scheduled_notification_writable' in validated_data:
            scheduled_notification_writable = validated_data.pop('scheduled_notification_writable')

        metadata_list = self.pop_metadata(validated_data)
        self.update_metadata(metadata_list, instance)

        if attending_users is not None:
            currently_attending_users = instance.attending_users.all()
            users_to_remove = set(currently_attending_users).difference(attending_users)
            users_to_add = set(attending_users).difference(set(currently_attending_users))

            # handle attending users that need to be removed
            for user in users_to_remove:
                # The following is equal to: instance.attending_users.remove(user)
                UserAttendsMeeting.objects.filter(meeting=instance, user=user).delete()

            # handle attending users that need to be added
            for user in users_to_add:
                # The following is equal to: instance.attending_users.add(user)
                UserAttendsMeeting.objects.create(meeting=instance, user=user)

        if attending_contacts is not None:
            currently_attending_contacts = instance.attending_contacts.all()
            contacts_to_remove = set(currently_attending_contacts).difference(attending_contacts)
            contacts_to_add = set(attending_contacts).difference(set(currently_attending_contacts))

            # handle attending contacts that need to be removed
            for contact in contacts_to_remove:
                # The following is equal to: instance.attending_contacts.remove(contact)
                ContactAttendsMeeting.objects.filter(meeting=instance, contact=contact).delete()

            # handle attending contacts that need to be added
            for contact in contacts_to_add:
                # The following is equal to: instance.attending_contacts.add(contact)
                ContactAttendsMeeting.objects.create(meeting=instance, contact=contact)

        instance = super(MeetingSerializer, self).update(instance, validated_data)

        if scheduled_notification_writable:
            self.update_or_create_schedulednotification(scheduled_notification_writable, instance)

        return instance
