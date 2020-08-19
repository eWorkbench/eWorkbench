#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.http import QueryDict
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action

from eric.projects.rest.viewsets.base import BaseAuthenticatedModelViewSet
from eric.sortable_menu.models import MenuEntry, MenuEntryParameter
from eric.sortable_menu.rest.serializers import MenuEntrySerializer, MenuEntryParameterSerializer


class MenuEntryViewSet(BaseAuthenticatedModelViewSet):
    """ Handles the customizable navigation menu. """

    serializer_class = MenuEntrySerializer
    pagination_class = None
    filterset_fields = ('visible',)

    def get_queryset(self):
        return MenuEntry.objects.viewable().prefetch_related('menu_entry_parameters')

    @action(detail=False, methods=['PUT'])
    def update_ordering(self, *args, **kwargs):
        """ Updates ordering of all menu entries for the current user. """

        for menu_entry in self.request.data:
            instance = MenuEntry.objects.viewable().get(pk=menu_entry['pk'])
            serializer = self.get_serializer(instance, data=menu_entry, many=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

        return self.list(self.request, *args, **kwargs)


class MenuEntryParameterViewSet(BaseAuthenticatedModelViewSet):
    """
    ViewSet for Menu Entry Parameters
    Should be nested below a menu entry
    """
    serializer_class = MenuEntryParameterSerializer

    pagination_class = None

    def initial(self, request, *args, **kwargs):
        """
        Verify that we have access to the selected menu entry
        Raises Http404 if we do not have access to the menu entry
        """
        super(MenuEntryParameterViewSet, self).initial(request, *args, **kwargs)

        if 'project_pk' in kwargs:
            get_object_or_404(MenuEntry.objects.viewable(), pk=kwargs['menu_entry_pk'])

    def get_queryset(self):
        return MenuEntryParameter.objects.viewable()

    def create(self, request, *args, **kwargs):
        """ Creates a new menu entry. """

        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request.data._mutable = True

        if 'menu_entry_pk' in request.data:
            request.data['menu_entry'] = request.data['menu_entry_pk']
        elif 'menu_entry_pk' in kwargs:
            request.data['menu_entry'] = kwargs['menu_entry_pk']

        return super(MenuEntryParameterViewSet, self).create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """ Updates a menu entry. """

        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request.data._mutable = True

        if 'menu_entry_pk' in request.data:
            request.data['menu_entry'] = request.data['menu_entry_pk']
        elif 'menu_entry_pk' in kwargs:
            request.data['menu_entry'] = kwargs['menu_entry_pk']

        return super(MenuEntryParameterViewSet, self).update(request, *args, **kwargs)
