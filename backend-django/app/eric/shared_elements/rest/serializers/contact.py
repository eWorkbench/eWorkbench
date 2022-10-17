#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import transaction

from rest_framework import serializers

from django_userforeignkey.request import get_current_user

from eric.core.rest.serializers import BaseModelSerializer, BaseModelWithCreatedByAndSoftDeleteSerializer, User
from eric.metadata.rest.serializers import EntityMetadataSerializer, EntityMetadataSerializerMixin
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField
from eric.shared_elements.models import Contact


class ContactSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """REST API Serializer for Contacts"""

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    class Meta:
        model = Contact
        fields = (
            "academic_title",
            "first_name",
            "last_name",
            "email",
            "phone",
            "company",
            "projects",
            "notes",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "version_number",
            "url",
            "metadata",
            "is_favourite",
        )

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


class ContactShareSerializer(ContactSerializer):
    """REST API Serializer for sharing contacts"""

    created_for = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Contact
        fields = (
            # standard fields, excluding "projects"
            "academic_title",
            "first_name",
            "last_name",
            "email",
            "phone",
            "company",
            "notes",
            "metadata",
            # custom fields for this serializer
            "created_for",
        )

    @transaction.atomic
    def create(self, validated_data):
        """Creates a copy of a contact for another user."""

        # take created_for field out of validated data
        receiving_user = validated_data.pop("created_for")
        sending_user = get_current_user()

        # pass usual data to standard contact serializer
        instance = super().create(validated_data)

        # hand over access to the receiving user
        if receiving_user != sending_user:
            # add access privilege for the receiving user (created_for field)
            from eric.model_privileges.models import ModelPrivilege

            ModelPrivilege.objects.update_or_create(
                user=receiving_user,
                content_type=instance.get_content_type(),
                object_id=instance.pk,
                defaults={
                    "full_access_privilege": ModelPrivilege.ALLOW,
                },
            )

            # remove access privilege from self
            initial_privilege = ModelPrivilege.objects.filter(
                user=sending_user,
                object_id=instance.pk,
                content_type=instance.get_content_type(),
            )
            initial_privilege.delete()

        return instance


class MinimalisticContactSerializer(BaseModelSerializer):
    """Minimalistic REST API Serializer for Contacts"""

    class Meta:
        model = Contact
        fields = ("academic_title", "first_name", "last_name", "email", "phone", "company", "url", "is_favourite")
