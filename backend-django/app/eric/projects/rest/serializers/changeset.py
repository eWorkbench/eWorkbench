#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from rest_framework import serializers

from eric.core.rest.serializers import PublicUserSerializer

from django_changeset.models import ChangeSet, ChangeRecord

User = get_user_model()


class ChangeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChangeRecord
        fields = ('field_name', 'old_value', 'new_value',)


class SimpleChangeSetSerializer(serializers.ModelSerializer):
    """
    A very basic changeset serializer
    """
    user = PublicUserSerializer(read_only=True)

    change_records = ChangeRecordSerializer(many=True, read_only=True)

    class Meta:
        model = ChangeSet
        fields = ('pk', 'user', 'object_type', 'object_uuid', 'changeset_type', 'date', 'change_records',)
        depth = 1


class ChangeSetSerializer(serializers.ModelSerializer):
    """
    An extended changeset serializer, which also displays more information about the element that was modified
    """
    user = PublicUserSerializer(read_only=True)

    change_records = ChangeRecordSerializer(many=True, read_only=True)

    object = serializers.SerializerMethodField()

    def get_object(self, obj):
        """
        Returns a "simple" variant of the object associated to this changeset (primary key and display)

        :return: a dictionary containing ``pk`` and ``display``
        :rtype: dict
        """
        model_class = obj.object_type.model_class()
        value = model_class.objects.filter(pk=obj.object_uuid).first()

        # This used to be like this:
        # if obj.object_type == Task.get_content_type():
        #     value = Task.objects.get(pk=obj.object_uuid)
        # elif obj.object_type == Meeting.get_content_type():
        #     value = Meeting.objects.get(pk=obj.object_uuid)
        # elif obj.object_type == Note.get_content_type():
        #     value = Note.objects.get(pk=obj.object_uuid)
        # elif obj.object_type == File.get_content_type():
        #     value = File.objects.get(pk=obj.object_uuid)
        # elif obj.object_type == Contact.get_content_type():
        #     value = Contact.objects.get(pk=obj.object_uuid)
        # elif obj.object_type == Dmp.get_content_type():
        #     value = Dmp.objects.get(pk=obj.object_uuid)
        # elif obj.object_type == Project.get_content_type():
        #     project = Project.objects.get(pk=obj.object_uuid)
        # elif obj.object_type == ProjectRoleUserAssignment.get_content_type():
        #     value = ProjectRoleUserAssignment.objects.get(pk=obj.object_uuid)
        # elif obj.object_type == LabBook.get_content_type():
        #     value = LabBook.objects.get(pk=obj.object_uuid)

        if value:
            return {
                'pk': value.pk,
                'display': value.__str__()
            }

        return {}

    class Meta:
        model = ChangeSet
        fields = ('pk', 'user', 'changeset_type', 'date', 'object_type', 'object_uuid', 'change_records', 'object',)
        depth = 1
