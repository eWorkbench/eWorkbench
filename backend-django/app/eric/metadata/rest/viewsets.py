#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.mail import EmailMultiAlternatives
from django.http import Http404, QueryDict, HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils.datastructures import MultiValueDict
from django.utils.translation import gettext_lazy as _
from django_userforeignkey.request import get_current_user
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import CreateModelMixin
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK
from rest_framework.utils import json
from rest_framework.viewsets import GenericViewSet

from eric.core.models import site_preferences
from eric.core.models.abstract import parse_parameters_for_workbench_models, get_all_workbench_models_with_args, \
    WorkbenchEntityMixin
from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.core.tests import custom_json_handler
from eric.metadata.models.models import Metadata, MetadataField
from eric.metadata.rest.errors import SearchParameterError, InvalidFieldInputError, InvalidOperatorError
from eric.metadata.rest.queryset_filters import MetadataQuerySetFilter
from eric.metadata.rest.serializers import MetadataFieldSerializer, MetadataSerializer


class MetadataViewSet(BaseAuthenticatedModelViewSet):
    """ ViewSet for the metadata on some base entity """
    serializer_class = MetadataSerializer
    parent_object = None  # defined by initial()
    pagination_class = None  # no pagination

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
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
        super(MetadataViewSet, self).initial(request, *args, **kwargs)
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        # creating new metadata requires that the parent_object is editable by the current user
        if not self.parent_object.is_editable():
            return HttpResponse(status=status.HTTP_403_FORBIDDEN)

        data = self.fill_request_data_with_parent_entity(request.data, args, kwargs)
        return super(MetadataViewSet, self).create(request, force_request_data=data, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        # updating metadata requires that the parent_object is editable by the current user
        if not self.parent_object.is_editable():
            return HttpResponse(status=status.HTTP_403_FORBIDDEN)

        data = self.fill_request_data_with_parent_entity(request.data, args, kwargs)
        return super(MetadataViewSet, self).update(request, force_request_data=data, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # deleting metadata requires that the parent_object is editable by the current user
        if not self.parent_object.is_editable():
            return HttpResponse(status=status.HTTP_403_FORBIDDEN)

        return super(MetadataViewSet, self).destroy(request, *args, **kwargs)

    def fill_request_data_with_parent_entity(self, request_data, args, kwargs):
        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request_data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request_data._mutable = True

        # parse arguments and return entity and primary key
        entity, pk, content_type = parse_parameters_for_workbench_models(*args, **kwargs)

        # auto-fill the parent entity
        request_data['entity_id'] = pk
        request_data['entity_content_type'] = content_type.pk
        request_data['values'] = json.dumps(request_data['values'], default=custom_json_handler)

        # JSONField doesn't parse JSON data sent via API, therefore we fake HTML input by passing a MultiValueDict
        # See also JSONField.get_value (.../rest_framework/fields.py)
        html_data = MultiValueDict()
        html_data.update(request_data)

        return html_data

    def get_queryset(self):
        """ Returns the metadata values associated to the parent entity """
        return Metadata.objects.filter(entity_id=self.parent_object.pk).order_by('created_at')


class MetadataFieldViewSet(BaseAuthenticatedModelViewSet):
    """ ViewSet for metadata fields """
    serializer_class = MetadataFieldSerializer
    queryset = MetadataField.objects.all()
    pagination_class = None  # no pagination

    def create(self, request, *args, **kwargs):
        user = get_current_user()

        if user.has_perm('metadata.add_metadatafield'):
            # instantly create new metadata-field for admins / users with the permission
            return super(MetadataFieldViewSet, self).create(request, *args, **kwargs)
        else:
            # validate input data
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # send new-metadata-request mail if the input is valid
            self.send_new_field_request_mail(request.data, user)

            # respond with some data, otherwise the frontend REST service will just return the request data as response
            return Response(status=HTTP_200_OK, data={
                'request_status': 'sent'
            })

    @staticmethod
    def send_new_field_request_mail(data, user):
        context = {
            'subject': _("New Metadata Field Request: {title}").format(title=data['name']),
            'request_author': user.username,
            'request_author_mail': user.email,
            'field_name': data['name'],
            'field_description': data['description'],
            'field_base_type': MetadataField.get_display_name_for_base_type(data['base_type']),
            'field_settings': data['type_settings'].items(),
        }
        html_message = render_to_string('email/user_requests_metadatafield.html', context)
        plaintext_message = render_to_string('email/user_requests_metadatafield.txt', context)

        msg = EmailMultiAlternatives(
            subject=context['subject'],
            body=plaintext_message,
            from_email=site_preferences.email_from,
            to=[settings.EMAIL_RECIPIENT_FOR_NEW_METADATA_FIELDS],
        )
        msg.attach_alternative(html_message, "text/html")

        msg.send()


class MetadataSearchViewSet(CreateModelMixin, GenericViewSet):
    """ Handles generic searches by custom metadata fields. """

    queryset = Metadata.objects.all()
    serializer_class = MetadataSerializer

    def filter_base_queryset_by_model(self, content_type_name):
        content_type = ContentType.objects.filter(model=content_type_name).first()
        if content_type is None:
            raise ValidationError('Unknown content type')

        self.queryset = self.queryset.filter(entity_content_type=content_type)

    def build_queryset_for_or_combination(self, or_combination):
        queryset = Metadata.objects.none()

        for and_combination in or_combination:
            and_queryset = self.build_queryset_for_and_combination(and_combination)
            queryset = queryset.union(and_queryset)

        return queryset

    def build_queryset_for_and_combination(self, and_combination):
        queryset = self.queryset

        for parameter in and_combination:
            entity_ids = self.build_queryset_for_parameter(parameter).values('entity_id')
            queryset = queryset.filter(entity_id__in=entity_ids)

        return queryset

    def build_queryset_for_parameter(self, param):
        if not {'field', 'values', 'operator', 'parameter_index'}.issubset(param):
            raise ValidationError(
                'Attributes "field", "operator", "values" and "parameter_index" are required per parameter.'
            )

        field_pk = param['field']
        values = param['values']  # metadata.values object
        operator = param['operator']  # = | < | <= | > | >=
        parameter_index = param['parameter_index']

        param_queryset = self.queryset.filter(field__pk=field_pk)
        field = MetadataField.objects.filter(pk=field_pk).first()

        if field is None:
            raise SearchParameterError(
                parameter_index,
                _("Invalid field: {field_pk}").format(field_pk=field_pk)
            )

        try:
            return MetadataQuerySetFilter(field).filter(param_queryset, values, operator)

        except InvalidFieldInputError:
            raise SearchParameterError(parameter_index, _("Invalid field input"))

        except InvalidOperatorError:
            raise SearchParameterError(parameter_index, _("Invalid operator for field"))

    def extract_viewable_entities_from_queryset(self, metadata_queryset):
        # check .viewable() for metadata results in bulk to boost performance
        # Implemented just like relations.models.RelationsMixIn.get_relations()

        metadata_list = list(metadata_queryset)

        pks_by_ct = {}
        model_by_ct = {}
        prefetched_objects_by_ct = {}

        # build map of models for content types
        workbench_models = get_all_workbench_models_with_args(WorkbenchEntityMixin)
        for param, model_details in workbench_models.items():
            ct = model_details['content_type'].id
            pks_by_ct[ct] = []
            model_by_ct[ct] = model_details['entity']

        # collect pks of search result entities
        for metadata in metadata_list:
            pks_by_ct[metadata.entity_content_type_id].append(metadata.entity_id)

        # prefetch viewable objects
        for ct in pks_by_ct:
            pks = pks_by_ct[ct]
            if len(pks) > 0:
                prefetched_objects_by_ct[ct] = model_by_ct[ct].objects.viewable().filter(
                    pk__in=pks
                ).prefetch_common()

                # retrieve the prefetched objects (via in_bulk)
                prefetched_objects_by_ct[ct] = prefetched_objects_by_ct[ct].in_bulk()

        return {
            metadata.entity for metadata in metadata_list
            if metadata.entity_id in prefetched_objects_by_ct[metadata.entity_content_type_id]
        }

    def serialize_entities(self, entities):
        serialized_entities = []

        for entity in entities:
            entity_serializer_class = entity._meta.get_default_serializer()
            entity_serializer = entity_serializer_class(instance=entity, context={'request': self.request})
            serialized_entities.append(entity_serializer.data)

        return serialized_entities

    def create(self, request, force_request_data=None, *args, **kwargs):
        """
        Starts a search by custom metadata fields.

        Expected POST data structure (JSON):
        ```
        {
            content_type: "task" | "meeting" | "contact" | "note" | ...
            parameters: [
                [<parameter>, <parameter>, ...],
                [<parameter>, <parameter>, ...],
                ...
            ]
        }
        ```

        The outer array will be interpreted as an OR-combination of AND-combinations,
        while the inner arrays are interpreted as AND-combinations of parameters.

        Parameter structure:
        ```
        {
            field: <metadata-field-pk>,
            operator: < | <= | = | => | > (depends on metadata field base type),
            values: <metadata values object> (depending on metadata field base type),
            parameter_index: <parameter index for error reporting>
        }
        ```
        """

        search_params = request.data
        content_type_name = search_params.get('content_type', None)
        or_combination = search_params.get('parameters', None)

        if not or_combination or not or_combination[0] or len(or_combination[0]) <= 0:
            raise ValidationError('At least one search parameter is required')

        if content_type_name:
            self.filter_base_queryset_by_model(content_type_name)

        or_queryset = self.build_queryset_for_or_combination(or_combination)
        entities = self.extract_viewable_entities_from_queryset(or_queryset)

        data = self.serialize_entities(entities)

        return Response(data)
