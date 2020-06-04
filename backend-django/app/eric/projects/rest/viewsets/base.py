#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.http import QueryDict
from django.utils.translation import gettext_lazy as _
from django.db import transaction
from django.core.exceptions import ValidationError

from rest_framework.decorators import action
from rest_framework.response import Response

from eric.core.models.base import disable_permission_checks
from eric.core.models.utils import get_permission_name
from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.model_privileges.models import ModelPrivilege
from eric.projects.rest.serializers.element_lock import ElementLockSerializer


class BaseAuthenticatedNestedProjectModelViewSet(BaseAuthenticatedModelViewSet):
    """
    Special Viewset for REST Endpoints that are nested below the /projects/{projectPk}/

    Enhances create and update methods by looking at the project_pk in kwargs

    When using this ViewSet, you should also overwrite the get_queryset method, e.g.:
    class NoteViewSet(BaseAuthenticatedNestedProjectModelViewSet):;

        # ,,,

        # get queryset
        def get_queryset(self):
            if 'project_pk' in self.kwargs:
                return Note.objects.viewable().for_project(self.kwargs['project_pk']).select_related('project')
            else:
                return Note.objects.viewable().select_related('project')

    """
    def create(self, request, *args, **kwargs):
        """ handle create requests with project_pk in kwargs """
        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request.data._mutable = True

        if 'project_pk' in request.data:
            request.data['project'] = request.data['project_pk']
        elif 'project_pk' in kwargs:
            request.data['project'] = kwargs['project_pk']

        return super(BaseAuthenticatedNestedProjectModelViewSet, self).create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """ handle update requests with project_pk in kwargs """
        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request.data._mutable = True

        if 'project_pk' in request.data:
            request.data['project'] = request.data['project_pk']
        elif 'project_pk' in kwargs:
            request.data['project'] = kwargs['project_pk']

        return super(BaseAuthenticatedNestedProjectModelViewSet, self).update(request, *args, **kwargs)


class BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet(BaseAuthenticatedModelViewSet):
    """
    Special Base Viewset for checking that users have the add_$model_without_project permission
    """
    def check_create_without_project(self, request, *args, **kwargs):
        """
        On create/update without projects, verify that the current user is allowed to do that
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        # ignore partial updates unless it contains projects
        if kwargs.get('partial') and 'projects' not in request.data:
            return

        if 'projects' not in request.data or len(request.data['projects']) == 0:
            user = request.user

            if user.has_perm(get_permission_name(self.serializer_class.Meta.model, 'add') + "_without_project"):
                # user is allowed to create this entity without a project relationship
                return
            else:
                raise ValidationError({
                    'projects': ValidationError(
                        _('You need to select a project'),
                        params={'projects': []},
                        code='invalid'
                    )
                })

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        self.check_create_without_project(request, *args, **kwargs)

        return super(BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, self).create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        self.check_create_without_project(request, *args, **kwargs)

        return super(BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, self).update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        If an object is deleted, we need to be able to delete ModelPrivileges too
        """
        # need to disable permission checks for model privilege when deleting something
        with disable_permission_checks(ModelPrivilege):
            # call destroy of super class
            return super(BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, self).destroy(
                self, request, *args, **kwargs
            )


class LockableViewSetMixIn(object):
    """
    ViewSet Mixin providing lock functionality
    """
    @action(detail=True, methods=['POST'])
    def lock(self, request, pk=None):
        obj = self.get_object()

        element_lock = obj.lock()

        return Response(
            ElementLockSerializer(element_lock).data
        )

    @action(detail=True, methods=['POST'])
    def unlock(self, request, pk=None):
        obj = self.get_object()

        obj.unlock()

        return Response({})

    @action(detail=True, methods=['GET'])
    def lock_status(self, request, pk=None):
        obj = self.get_object()

        element_lock = obj.get_lock_element()

        if element_lock.exists():
            return Response(
                ElementLockSerializer(element_lock.first()).data
            )
        else:
            return Response({})
