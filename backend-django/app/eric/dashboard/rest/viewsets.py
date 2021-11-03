#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.serializers import Serializer

from eric.core.rest.viewsets import BaseGenericViewSet
from eric.dashboard.rest.serializers import DashboardProjectSerializer, DashboardContactSerializer, \
    DashboardFileSerializer, DashboardTaskSerializer, DashboardDmpSerializer, DashboardResourceSerializer
from eric.dmp.rest.viewsets import DmpViewSet
from eric.projects.rest.viewsets import ProjectViewSet, ResourceViewSet
from eric.shared_elements.rest.viewsets import ContactViewSet, FileViewSet, TaskViewSet


class MyDashboardViewSet(BaseGenericViewSet, viewsets.mixins.ListModelMixin):
    """
    ViewSet providing elements for the dashboard

    This viewset calls other viewsets, such as the ProjectViewSet, MeetingViewSet
    """

    # we need some serializer definition for the openAPI generation
    serializer_class = Serializer

    # define the viewsets for all entities that should be provided by the dashboard
    viewsets = {
        'projects': ProjectViewSet,
        'contacts': ContactViewSet,
        'files': FileViewSet,
        'tasks': TaskViewSet,
        'dmps': DmpViewSet,
        'resources': ResourceViewSet,
    }

    # use slimmed down serializers for the dashboard to only load what we need to display
    dashboard_serializers = {
        'projects': DashboardProjectSerializer,
        'contacts': DashboardContactSerializer,
        'files': DashboardFileSerializer,
        'tasks': DashboardTaskSerializer,
        'dmps': DashboardDmpSerializer,
        'resources': DashboardResourceSerializer,
    }

    def get_serialized_data_for(self, request, view_name, num_elements):
        """
        Returns serialized data for a given view (e.g., tasks)
        """
        assert view_name in self.viewsets

        view_class = self.viewsets[view_name]
        view = view_class(request=request)

        # call initial method
        view.initial(request)

        # get queryset
        qs = view.get_queryset()

        # handle special cases for sorting etc...
        if view_name == 'tasks':
            qs = qs.assigned().order_by('due_date').not_done()
        elif view_name == 'projects':
            qs = qs.order_by('start_date').not_closed_or_deleted_or_canceled()
        else:
            qs = qs.order_by('-last_modified_at')

        # filter soft deleted elements
        qs = qs.filter(deleted=False)

        qs = qs[:num_elements]
        # use the slimmed down dashboard serializers if available
        if view_name in self.dashboard_serializers:
            return self.dashboard_serializers[view_name](instance=qs, many=True).data
        return view.get_serializer(instance=qs, many=True).data

    def list(self, request, *args, **kwargs):
        """
        ViewSet list endpoint
        Provides all the data that are displayed in a dashboard
        """
        limit = 10

        data = {
            'projects': self.get_serialized_data_for(request, 'projects', limit),
            'contacts': self.get_serialized_data_for(request, 'contacts', limit),
            'dmps': self.get_serialized_data_for(request, 'dmps', limit),
            'files': self.get_serialized_data_for(request, 'files', limit),
            'tasks': self.get_serialized_data_for(request, 'tasks', limit),
            'resources': self.get_serialized_data_for(request, 'resources', limit),
        }

        return Response(data)
