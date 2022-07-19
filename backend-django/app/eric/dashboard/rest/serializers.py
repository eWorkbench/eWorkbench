#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import serializers

from eric.dmp.models import Dmp
from eric.projects.models import Project, Resource
from eric.shared_elements.models import Contact, File, Task


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
            'full_day',
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
