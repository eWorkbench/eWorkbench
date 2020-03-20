#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_changeset.models import ChangeSet
from rest_framework import serializers

from eric.core.rest.serializers import BaseModelWithCreatedBySerializer
from eric.dmp.models import Dmp
from eric.drives.models import Drive
from eric.kanban_boards.models import KanbanBoard
from eric.labbooks.models import LabBook
from eric.projects.models import Project, Resource
from eric.shared_elements.models import Meeting, Contact, File, Note, Task


class DashboardProjectSerializer(serializers.ModelSerializer):
    """ A very minimalistic project serializer, only displaying name and pk """

    class Meta:
        model = Project
        fields = (
            'pk',
            'name',
            'start_date',
            'stop_date',
            'project_state',
        )


class DashboardMeetingSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = Meeting
        fields = (
            'pk',
        )


class DashboardContactSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = Contact
        fields = (
            'pk',
            'company',
            'email',
            'academic_title',
            'first_name',
            'last_name',
        )


class DashboardFileSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = File
        fields = (
            'pk',
            'name',
            'file_size',
            'original_filename',
        )


class DashboardNoteSerializer(BaseModelWithCreatedBySerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = Note
        fields = (
            'pk',
            'subject',
            'created_at',
            'created_by',
        )


class DashboardTaskSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = Task
        fields = (
            'pk',
            'title',
            'priority',
            'state',
            'due_date',
        )


class DashboardDmpSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = Dmp
        fields = (
            'pk',
            'title',
            'status',
            'created_at',
        )


class DashboardLabBookSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = LabBook
        fields = (
            'pk',
        )


class DashboardChangeSetSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    object = serializers.SerializerMethodField()

    def get_object(self, obj):
        """
        Returns a "simple" variant of the object associated to this changeset (primary key and display)

        :return: a dictionary containing ``pk`` and ``display``
        :rtype: dict
        """
        model_class = obj.object_type.model_class()
        value = model_class.objects.filter(pk=obj.object_uuid).first()

        if value:
            return {
                'pk': value.pk,
                'display': value.__str__()
            }

        return {}

    class Meta:
        model = ChangeSet
        fields = (
            'pk',
            'object',
            'object_type',
            'changeset_type',
        )
        depth = 1


class DashboardResourceSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = Resource
        fields = (
            'pk',
            'name',
            'type',
            'description',
        )


class DashboardKanbanBoardSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = KanbanBoard
        fields = (
            'pk',
        )


class DashboardDriveSerializer(serializers.ModelSerializer):
    """
    A very minimalistic (read only) serializer for the dashboard
    """
    class Meta:
        model = Drive
        fields = (
            'pk',
        )
