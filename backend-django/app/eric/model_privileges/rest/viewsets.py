#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.http import QueryDict, Http404
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from eric.core.models.abstract import parse_parameters_for_workbench_models
from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.model_privileges.models import ModelPrivilege
from eric.model_privileges.rest.serializers import ModelPrivilegeSerializer
from eric.model_privileges.utils import get_model_privileges_and_project_permissions_for
from eric.shared_elements.models import Task, Meeting, Contact

User = get_user_model()


class ModelPrivilegeViewSet(BaseAuthenticatedModelViewSet):
    """ ViewSet for Privileges of an entity """
    serializer_class = ModelPrivilegeSerializer

    pagination_class = None

    # define user_id as a the lookup field for model privileges (instead of the model privilege primary key)
    lookup_field = 'user_id'

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        :param args:
        :param kwargs:
        :return:
        """
        # parse arguments and return entity and primary key
        entity, pk, content_type = parse_parameters_for_workbench_models(*args, **kwargs)

        if not entity:
            # wrong entity specified
            raise Http404

        # get viewable queryset and prefetch projects
        qs = entity.objects.viewable().prefetch_related('projects')

        if entity == Task:
            # special case for Tasks: prefetch assigned users
            qs = qs.prefetch_related('assigned_users')
        elif entity == Meeting:
            # special case for Meetings: prefetch attending users
            qs = qs.prefetch_related('attending_users')
        elif entity == Contact:
            # special case for Contacts: prefetch attending meetings
            qs = qs.prefetch_related('attending_meetings')

        return get_object_or_404(qs, pk=pk)

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(ModelPrivilegeViewSet, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        """ handle create requests with object type and object_pk in kwargs """
        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request.data._mutable = True

        # parse arguments and return entity and primary key
        entity, pk, content_type = parse_parameters_for_workbench_models(*args, **kwargs)

        request.data['object_id'] = pk
        # request.data['content_type'] = content_type
        request.data['content_type_pk'] = content_type.pk

        # check if a privilege for this user already exists
        try:
            user_pk = int(request.data['user_pk'])
        except:
            raise NotFound

        # get the existing privilege for the given object
        existing_priv = ModelPrivilege.objects.for_model(self.parent_object.__class__).filter(
            object_id=self.parent_object.pk
        ).editable().filter(user=user_pk).first()

        if existing_priv:
            # it already exists, we just need to update it
            serializer = self.get_serializer(existing_priv, data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

            return Response(serializer.data, status=status.HTTP_200_OK)

        return super(ModelPrivilegeViewSet, self).create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Delete/Destroy a model privilege

        Special case: If a modal privilege is "inherited", it does not exist (therefore instance.pk == "").
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        instance = self.get_object()

        # Special case: privilege does not exist
        if instance.pk == "":
            # this can not be deleted, as this privilege is inherited from project permissions
            # however, we can create a new privilege with everything set to deny to fulfill the wish of the user
            ModelPrivilege.objects.create(
                user=instance.user,
                full_access_privilege=ModelPrivilege.PRIVILEGE_CHOICES_DENY,
                view_privilege=ModelPrivilege.PRIVILEGE_CHOICES_DENY,
                edit_privilege=ModelPrivilege.PRIVILEGE_CHOICES_DENY,
                delete_privilege=ModelPrivilege.PRIVILEGE_CHOICES_DENY,
                trash_privilege=ModelPrivilege.PRIVILEGE_CHOICES_DENY,
                restore_privilege=ModelPrivilege.PRIVILEGE_CHOICES_DENY,
                content_object=self.parent_object
            )

            return Response(status=status.HTTP_204_NO_CONTENT)

        # let the super class handle the remaining destroy
        self.perform_destroy(instance)

        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        """
        Update a model privilege

        Special case: If the modal privilege is "inherited", it does not exist (therefore instnace.pk == "").
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        user_id = kwargs.get('user_id', None)

        # Reset all other privileges if full_access is allowed
        if "full_access_privilege" in request.data \
                and request.data["full_access_privilege"] == instance.PRIVILEGE_CHOICES_ALLOW:
            request.data["view_privilege"] = instance.PRIVILEGE_CHOICES_NEUTRAL
            request.data["edit_privilege"] = instance.PRIVILEGE_CHOICES_NEUTRAL
            request.data["delete_privilege"] = instance.PRIVILEGE_CHOICES_NEUTRAL
            request.data["trash_privilege"] = instance.PRIVILEGE_CHOICES_NEUTRAL
            request.data["restore_privilege"] = instance.PRIVILEGE_CHOICES_NEUTRAL

        # Special case: privilege does not exist
        if instance.pk == "":
            # this is actually not in the database yet, but a project permission
            # we need to create it first
            instance = ModelPrivilege.objects.create(
                user_id=user_id,
                content_type=instance.content_type,
                object_id=instance.object_id
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def get_object(self):
        """
        Returns a single privilege based on the kwargs user_id
        :return:
        """
        user_pk = None
        # make sure user_pk is an integer
        try:
            user_pk = int(self.kwargs['user_id'])
        except:
            raise NotFound

        # parse arguments and return entity and primary key
        entity, pk, content_type = parse_parameters_for_workbench_models(*self.args, **self.kwargs)

        user = User.objects.filter(pk=user_pk).first()

        privileges = get_model_privileges_and_project_permissions_for(
            self.parent_object.__class__, self.parent_object, user
        )

        assert len(privileges) == 1

        return privileges[0]

    def list(self, request, *args, **kwargs):
        """
        Returns a list of model privileges

        The ModelViewSet list() method would also apply some filtering, which we don't want
        Hence we had to overwrite this method
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data)

    @method_decorator(cache_page(30))
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieves a single model privilege

        The ModelViewSet retrieve() method would also apply some filtering, which we don't want
        Hence we had to overwrite this method
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        obj = self.get_object()

        serializer = self.get_serializer(obj, many=False)

        return Response(serializer.data)

    def get_queryset(self):
        """
        Returns the queryset of model privileges for the given parent object
        :return:
        """
        return get_model_privileges_and_project_permissions_for(
            self.parent_object.__class__, self.parent_object
        )
