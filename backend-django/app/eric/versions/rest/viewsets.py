#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import Http404, QueryDict, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.datastructures import MultiValueDict
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response

from eric.core.models import DisableSignals
from eric.core.models.abstract import parse_parameters_for_workbench_models
from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.core.tests import custom_json_handler
from eric.labbooks.models import LabBook
from eric.versions.models.models import Version
from eric.versions.rest.serializers import VersionSerializer


class VersionViewSet(BaseAuthenticatedModelViewSet):
    """ ViewSet for the version on a specific project related model (e.g., Task, Meeting, ...)"""
    serializer_class = VersionSerializer
    pagination_class = LimitOffsetPagination
    parent_object = None  # defined by initial()

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
            # wrong entity or no access
            raise Http404

        # get viewable queryset
        qs = entity.objects.viewable()

        return get_object_or_404(qs, pk=pk)

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object) -- prior to any handler
        """
        super(VersionViewSet, self).initial(request, *args, **kwargs)
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        """
        Create a new version
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request.data._mutable = True

        # creating a new version requires that the parent_object is editable by the current user
        if not self.parent_object.is_editable():
            return HttpResponse(status=status.HTTP_403_FORBIDDEN)

        if self.parent_object.is_locked():
            # element is locked by another user
            raise ValidationError({
                'non_field_errors': ValidationError(
                    _("This object is currently locked by another user"),
                    params={'instance': self.parent_object},
                    code='invalid'
                )
            })

        # parse arguments and return entity and primary key
        entity, pk, content_type = parse_parameters_for_workbench_models(*args, **kwargs)

        # for LabBooks we need to create new versions of all their elements too,
        # before exporting the labbook data (the labbook export references the latest versions)
        if self.is_labbook():
            self.create_versions_for_all_labbook_elements(self.parent_object)

        # auto-fill the version data and discard the POST data (except for the summary)
        request.data['object_id'] = pk
        request.data['content_type_pk'] = content_type.pk
        metadata = self.parent_object.export_metadata()
        request.data['metadata'] = json.dumps(metadata, default=custom_json_handler)

        # JSONField doesn't parse JSON data sent via API, therefore we fake HTML input by passing a MultiValueDict
        # See also JSONField.get_value (.../rest_framework/fields.py)
        data = MultiValueDict()
        data.update(request.data)
        return super(VersionViewSet, self).create(request, force_request_data=data, *args, **kwargs)

    def is_labbook(self):
        return isinstance(self.parent_object, LabBook)

    @staticmethod
    def create_versions_for_all_labbook_elements(labbook):
        last_labbook_version = Version.objects.filter(object_id=labbook.pk).order_by('-number').first()
        new_labbook_version_number = last_labbook_version.number + 1 if last_labbook_version is not None else 1
        for element in labbook.child_elements.all():
            child_object = element.child_object

            # serialize the metadata
            metadata = child_object.export_metadata()
            metadata = json.loads(json.dumps(metadata, default=custom_json_handler))

            version = Version(
                content_object=child_object,
                metadata=metadata,
                summary="v{version} {labbook} {title}".format(
                    labbook=_("of LabBook:"), title=labbook.title, version=new_labbook_version_number
                ),
            )
            version.save()

    @transaction.atomic
    @action(detail=True, methods=['POST'])
    def restore(self, request, format=None, *args, **kwargs):
        version = self.get_object()

        model = self.parent_object
        model.restore_metadata(version.metadata)
        model.save()

        data = self.serialize_model(request, self.parent_object, version)

        return Response(data)

    @action(detail=True, methods=['GET'])
    def preview(self, request, format=None, *args, **kwargs):
        version = self.get_object()

        # Creating a preview based on an actual model is not a trivial task.
        # Problem:
        #   Django persists changes to relations immediately -> a preview would cause the actual data to change.
        #   It is not possible to just use a temporary clone of the model, because for the ORM referencing to work,
        #   the model has to be saved. Saving the clone is not entirely possible tho, because the clone has the same
        #   references to and from other entities -> 1-1 and 1-* relations are violated.
        # Solution:
        #   To avoid all the problems, we actually restore the version
        #   and rollback all the changes after generating the output data.

        with transaction.atomic():
            # create a savepoint, so that we can restore the original state after generating the preview data
            savepoint_id = transaction.savepoint()

            model = self.parent_object

            # disable all signals (e.g., permission checks, lock checks) for all models, so users with readonly-access
            # can always see the preview - they might not be able to actually restore it because of locks/permissions
            with DisableSignals():
                model.restore_metadata(version.metadata)
                data = self.serialize_model(request, model, version)

            # the preview data has been generated, now rollback all changes
            transaction.savepoint_rollback(savepoint_id)

        return Response(data)

    def serialize_model(self, request, model_instance, version):
        serializer_class = model_instance._meta.get_default_serializer()
        serializer = serializer_class(instance=model_instance, context={'request': request})
        data = serializer.data

        # generate sub-elements for LabBooks
        if self.is_labbook():
            data['child_elements'] = self.build_labbook_element_list(version.metadata)

        return data

    def build_labbook_element_list(self, metadata):
        elements = list()
        for element in metadata.get("child_elements"):
            content_type = ContentType.objects.get(pk=element['child_object_content_type_id'])
            element_class = content_type.model_class()
            child_object = element_class.objects.filter(pk=element['child_object_id']).first()
            if child_object is not None:  # ignore hard-deleted elements
                display_name = str(child_object) if child_object.is_viewable() else None
                elements.append({
                    'type': content_type.name,
                    'display_name': display_name,
                    'version_number': element['child_object_version_number'],
                    'viewable': child_object.is_viewable()
                })

        return elements

    def get_queryset(self):
        """
        Returns the version for the given parent model
        :return:
        """
        return Version.objects.filter(
            content_type=self.parent_object.get_content_type(),
            object_id=self.parent_object.pk
        ).order_by(
            '-number'
        )
