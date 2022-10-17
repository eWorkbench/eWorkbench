#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.http import Http404, QueryDict
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
from eric.shared_elements.models import CalendarAccess, Contact, Meeting, Task

User = get_user_model()


class ModelPrivilegeViewSet(BaseAuthenticatedModelViewSet):
    """ViewSet for Privileges of an entity"""

    serializer_class = ModelPrivilegeSerializer

    pagination_class = None

    # define user_id as a the lookup field for model privileges (instead of the model privilege primary key)
    lookup_field = "user_id"

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        """
        # parse arguments and return entity and primary key
        entity, pk, content_type = parse_parameters_for_workbench_models(*args, **kwargs)

        if not entity:
            # wrong entity specified
            raise Http404

        # get viewable queryset and prefetch projects
        qs = entity.objects.viewable().prefetch_related("projects")

        if entity == Task:
            # special case for Tasks: prefetch assigned users
            qs = qs.prefetch_related("assigned_users")
        elif entity == Meeting:
            # special case for Meetings: prefetch attending users
            qs = qs.prefetch_related("attending_users")
        elif entity == Contact:
            # special case for Contacts: prefetch attending meetings
            qs = qs.prefetch_related("attending_meetings")
        elif entity == CalendarAccess:
            # special case for CalenderAccessPrivilege: it has no projects
            qs = entity.objects.viewable()

        return get_object_or_404(qs, pk=pk)

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super().initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        """Creates a model privilege for the base model."""

        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request.data._mutable = True

        # parse arguments and return entity and primary key
        entity, pk, content_type = parse_parameters_for_workbench_models(*args, **kwargs)

        request.data["object_id"] = pk
        request.data["content_type_pk"] = content_type.pk

        # check if a privilege for this user already exists
        try:
            user_pk = int(request.data["user_pk"])
        except Exception:
            raise NotFound

        # get the existing privilege for the given object
        existing_priv = (
            ModelPrivilege.objects.for_model(self.parent_object.__class__)
            .filter(object_id=self.parent_object.pk)
            .editable()
            .filter(user=user_pk)
            .first()
        )

        if existing_priv:
            # it already exists, we just need to update it
            serializer = self.get_serializer(existing_priv, data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

            return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Deletes a model privilege.
        Special case for inherited privileges: If instance.pk is empty, a ModelPrivilege will be created instead,
        with all options set to DENY.
        """
        instance = self.get_object()

        # Special case: privilege does not exist
        if instance.pk == "":
            # this can not be deleted, as this privilege is inherited from project permissions
            # however, we can create a new privilege with everything set to deny to fulfill the wish of the user
            ModelPrivilege.objects.create(
                user=instance.user,
                full_access_privilege=ModelPrivilege.DENY,
                view_privilege=ModelPrivilege.DENY,
                edit_privilege=ModelPrivilege.DENY,
                delete_privilege=ModelPrivilege.DENY,
                trash_privilege=ModelPrivilege.DENY,
                restore_privilege=ModelPrivilege.DENY,
                content_object=self.parent_object,
            )

            return Response(status=status.HTTP_204_NO_CONTENT)

        # let the super class handle the remaining destroy
        self.perform_destroy(instance)

        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        """
        Updates a model privilege. Creates the privilege if instance.pk is empty.
        If full_access is granted, all other privilege options are set to NEUTRAL.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        user_id = kwargs.get("user_id", None)

        # Reset all other privileges if full_access is allowed
        if "full_access_privilege" in request.data and request.data["full_access_privilege"] == ModelPrivilege.ALLOW:
            request.data["view_privilege"] = ModelPrivilege.NEUTRAL
            request.data["edit_privilege"] = ModelPrivilege.NEUTRAL
            request.data["delete_privilege"] = ModelPrivilege.NEUTRAL
            request.data["trash_privilege"] = ModelPrivilege.NEUTRAL
            request.data["restore_privilege"] = ModelPrivilege.NEUTRAL

        # Special case: privilege does not exist
        if instance.pk == "":
            # this is actually not in the database yet, but a project permission
            # we need to create it first
            instance = ModelPrivilege.objects.create(
                user_id=user_id, content_type=instance.content_type, object_id=instance.object_id
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        # Check if the privileges are correct and fix them if they are not. We start checking them from the
        # right side and fix privilege based on the "highest" allowed privilege in the following order:
        # restore > trash > edit > view
        if request.data.get("restore_privilege") == ModelPrivilege.ALLOW:
            request.data["view_privilege"] = ModelPrivilege.ALLOW
            request.data["edit_privilege"] = ModelPrivilege.ALLOW
            request.data["trash_privilege"] = ModelPrivilege.ALLOW
        elif request.data.get("trash_privilege") == ModelPrivilege.ALLOW:
            request.data["view_privilege"] = ModelPrivilege.ALLOW
            request.data["edit_privilege"] = ModelPrivilege.ALLOW
        elif request.data.get("edit_privilege") == ModelPrivilege.ALLOW:
            request.data["view_privilege"] = ModelPrivilege.ALLOW

        # Now, we must also check the denied privileges. We start checking them from the left side and fix
        # privilege based on the "lowest" denied privilege in the following order:
        # view > edit > trash > restore
        if request.data.get("view_privilege") == ModelPrivilege.DENY:
            request.data["edit_privilege"] = ModelPrivilege.DENY
            request.data["trash_privilege"] = ModelPrivilege.DENY
            request.data["restore_privilege"] = ModelPrivilege.DENY
        elif request.data.get("edit_privilege") == ModelPrivilege.DENY:
            request.data["trash_privilege"] = ModelPrivilege.DENY
            request.data["restore_privilege"] = ModelPrivilege.DENY
        elif request.data.get("trash_privilege") == ModelPrivilege.DENY:
            request.data["restore_privilege"] = ModelPrivilege.DENY

        return super().partial_update(request, *args, **kwargs)

    def get_object(self):
        """
        Returns a single privilege based on the kwargs user_id
        """
        user_pk = None
        # make sure user_pk is an integer
        try:
            user_pk = int(self.kwargs["user_id"])
        except Exception:
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
        Returns a list of model privileges.
        """

        # The ModelViewSet list() method would also apply some filtering, which we don't want.
        # Hence we had to overwrite this method.

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data)

    @method_decorator(cache_page(30))
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieves a single model privilege.
        """

        # The ModelViewSet retrieve() method would also apply some filtering, which we don't want.
        # Hence we had to overwrite this method.

        obj = self.get_object()

        serializer = self.get_serializer(obj, many=False)

        return Response(serializer.data)

    def get_queryset(self):
        """
        Returns the queryset of model privileges for the given parent object
        """
        return get_model_privileges_and_project_permissions_for(self.parent_object.__class__, self.parent_object)
