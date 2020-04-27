#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import viewsets
from rest_framework.response import Response

from eric.dashboard.rest.serializers import DashboardProjectSerializer, DashboardMeetingSerializer, \
    DashboardContactSerializer, DashboardFileSerializer, DashboardNoteSerializer, DashboardTaskSerializer, \
    DashboardDmpSerializer, DashboardLabBookSerializer, DashboardChangeSetSerializer, DashboardResourceSerializer, \
    DashboardKanbanBoardSerializer, DashboardDriveSerializer
from eric.drives.models import Drive
from eric.drives.rest.viewsets import DriveViewSet
from eric.kanban_boards.models import KanbanBoard
from eric.kanban_boards.rest.viewsets import KanbanBoardViewSet
from eric.projects.rest.viewsets import ProjectViewSet, ResourceViewSet, ChangeSetViewSet
from eric.shared_elements.rest.viewsets import MeetingViewSet, ContactViewSet, FileViewSet, NoteViewSet, TaskViewSet
from eric.dmp.rest.viewsets import DmpViewSet
from eric.labbooks.rest.viewsets import LabBookViewSet
from eric.core.rest.viewsets import BaseGenericViewSet

from eric.projects.models import Project, Resource
from eric.shared_elements.models import Task, Meeting, Contact, File, Note
from eric.dmp.models import Dmp
from eric.labbooks.models import LabBook


class MyDashboardViewSet(BaseGenericViewSet, viewsets.mixins.ListModelMixin):
    """
    ViewSet providing elements for the dashboard

    This viewset calls other viewsets, such as the ProjectViewSet, MeetingViewSet
    """

    # define the viewsets for all entities that should be provided by the dashboard
    viewsets = {
        'projects': ProjectViewSet,
        'meetings': MeetingViewSet,
        'contacts': ContactViewSet,
        'files': FileViewSet,
        'notes': NoteViewSet,
        'tasks': TaskViewSet,
        'dmps': DmpViewSet,
        'labbooks': LabBookViewSet,
        'history': ChangeSetViewSet,
        'resources': ResourceViewSet,
        'kanbanboards': KanbanBoardViewSet,
        'drives': DriveViewSet
    }

    # use slimmed down serializers for the dashboard to only load what we need to display
    dashboard_serializers = {
        'projects': DashboardProjectSerializer,
        'meetings': DashboardMeetingSerializer,
        'contacts': DashboardContactSerializer,
        'files': DashboardFileSerializer,
        'notes': DashboardNoteSerializer,
        'tasks': DashboardTaskSerializer,
        'dmps': DashboardDmpSerializer,
        'labbooks': DashboardLabBookSerializer,
        'history': DashboardChangeSetSerializer,
        'resources': DashboardResourceSerializer,
        'kanbanboards': DashboardKanbanBoardSerializer,
        'drives': DashboardDriveSerializer
    }

    def get_summary(self, request):
        """
        Get the counts of all non-trashed viewable items
        :param request:
        :return:
        """
        return {
            'projects': Project.objects.viewable().filter(deleted=False).count(),
            'tasks': Task.objects.viewable().filter(deleted=False).count(),
            'meetings': Meeting.objects.viewable().filter(deleted=False).count(),
            'files': File.objects.viewable().filter(deleted=False).count(),
            'notes': Note.objects.viewable().filter(deleted=False).count(),
            'dmps': Dmp.objects.viewable().filter(deleted=False).count(),
            'labbooks': LabBook.objects.viewable().filter(deleted=False).count(),
            'kanbanboards': KanbanBoard.objects.viewable().filter(deleted=False).count(),
            'contacts': Contact.objects.viewable().filter(deleted=False).count(),
            'drives': Drive.objects.viewable().filter(deleted=False).count(),
            'resources': Resource.objects.viewable().filter(deleted=False).count(),
        }

    def get_serialized_data_for(self, request, view_name, num_elements):
        """
        Returns serialized data for a given view (e.g., tasks)
        :param request:
        :param view_name:
        :param num_elements:
        :return:
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
        elif view_name == 'history':
            # history should be sorted anyway
            pass
        else:
            qs = qs.order_by('-last_modified_at')

        # filter soft deleted elements (not available for history)
        if view_name != 'history':
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
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        # restrict number of elements shown for each element
        num_elements = 10

        data = {
            'projects': self.get_serialized_data_for(request, 'projects', num_elements),
            # 'meetings': self.get_serialized_data_for(request, 'meetings', num_elements),
            'contacts': self.get_serialized_data_for(request, 'contacts', num_elements),
            # 'notes': self.get_serialized_data_for(request, 'notes', num_elements),
            # 'history': self.get_serialized_data_for(request, 'history', num_elements),
            'dmps': self.get_serialized_data_for(request, 'dmps', num_elements),
            # 'kanbanboards': self.get_serialized_data_for(request, 'kanbanboards', num_elements),
            # 'labbooks': self.get_serialized_data_for(request, 'labbooks', num_elements),
            'files': self.get_serialized_data_for(request, 'files', num_elements),
            'tasks': self.get_serialized_data_for(request, 'tasks', num_elements),
            'resources': self.get_serialized_data_for(request, 'resources', num_elements),
            # 'drives': self.get_serialized_data_for(request, 'drives', num_elements),
            'summary': self.get_summary(request)
        }

        return Response(data)
