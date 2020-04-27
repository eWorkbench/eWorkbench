#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from django_changeset.models import ChangeSet
from django_userforeignkey.request import get_current_user

from eric.core.models.abstract import parse_parameters_for_workbench_models, WorkbenchEntityMixin, \
    get_all_workbench_models
from eric.core.rest.viewsets import BaseAuthenticatedReadOnlyModelViewSet
from eric.projects.models import ProjectRoleUserAssignment
from eric.projects.rest.serializers.changeset import ChangeSetSerializer, SimpleChangeSetSerializer


class GenericChangeSetViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    """ Viewset for generic changes on a specific project related model (e.g., Task, Meeting, ...)"""
    serializer_class = SimpleChangeSetSerializer

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

        # get viewable queryset
        qs = entity.objects.viewable()

        return get_object_or_404(qs, pk=pk)

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(GenericChangeSetViewSet, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    def get_queryset(self):
        """
        Returns the changeset for the given parent model
        :return:
        """
        return ChangeSet.objects.filter(
            object_type=self.parent_object.get_content_type(),
            object_uuid=self.parent_object.pk
        ).select_related(
            'user', 'user__userprofile', 'object_type'
        ).prefetch_related(
            'change_records'
        )


class ChangeSetViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    """ Viewset for all changes that the current user is allowed to see """
    serializer_class = ChangeSetSerializer
    search_model_param = 'model'
    ordering_fields = ('date',)

    def get_models_based_on_request(self, request):
        all_workbench_models = get_all_workbench_models(WorkbenchEntityMixin)
        all_workbench_models.append(ProjectRoleUserAssignment)  # not a workbench entity of its own

        if not request:
            return all_workbench_models

        params = request.query_params.get(self.search_model_param, '')
        if not params:
            return all_workbench_models

        # parse params (split by ,)
        requested_model_names = params.replace(',', ' ').split()

        return [
            model for model in all_workbench_models
            if model.__name__.lower() in requested_model_names
        ]

    def get_queryset(self):
        """
        gets a queryset with all changes to the items that the current user has access to
        :return:
        """
        user = get_current_user()

        if user.is_anonymous:
            return ChangeSet.objects.none()

        # build a conditions list, where we will add more conditions with "OR"
        conditions = Q()

        # get all relevant search models
        workbench_models = self.get_models_based_on_request(self.request)

        # temporary fix: load ChangeSets for single models only, to avoid excessive performance hits
        # TODO: Fix underlying performance problem. Suspect #1: .prefetch_related('change_records')
        if len(workbench_models) <= 0 or len(workbench_models) > 1:
            return ChangeSet.objects.none()

        # iterate over search models
        for model in workbench_models:
            object_ids = model.objects.viewable()

            # add conditions to existing conditions with OR
            conditions = conditions | Q(
                object_type=model.get_content_type(),
                object_uuid__in=object_ids
            )

        # query changesets with above conditions
        return ChangeSet.objects.filter(
            conditions
        ).order_by(
            '-date'
        ).select_related(
            'user', 'user__userprofile', 'object_type'
        ).prefetch_related(
            'change_records'
        )
