#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
from itertools import chain
from operator import attrgetter

from django.apps.registry import apps
from django.contrib.postgres.search import SearchRank
from django.db import models
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.serializers import Serializer

from eric.core.models.abstract import get_all_workbench_models, WorkbenchEntityMixin
from eric.core.rest.viewsets import BaseGenericViewSet
from eric.search.models import FTSMixin
from eric.search.models.search import FollowedBySearchQuery

logger = logging.getLogger(__name__)


class SearchViewSet(BaseGenericViewSet):
    search_limit_per_model = 10
    search_param = 'search'
    search_model_param = 'model'

    ordering_fields = ()
    filter_backends = ()
    pagination_class = None

    # we need some serializer definition for the openAPI generation
    serializer_class = Serializer

    def get_queryset(self):
        return False

    def get_search_terms(self, request):
        """
        Search terms are set by a ?search=... query parameter,
        and may be comma and/or whitespace delimited.
        """
        if not request:
            return []

        params = request.query_params.get(self.search_param, '')
        return [
            term.replace(':', '').replace('*', '')
            for term in params.replace(',', ' ').split() if term
        ]

    def get_search_models(self, request):
        """
        Search models are set by a ?model=... query parameter,
        and may be comma and/or whitespace delimited.
        """
        workbench_searchable_elements = get_all_workbench_models(WorkbenchEntityMixin, FTSMixin)

        available_models = dict([(model.__name__.lower(), model) for model in workbench_searchable_elements])

        # search on all available models if no request available
        if not request:
            return available_models.values()

        params = request.query_params.get(self.search_model_param, '')

        # search on all available models if not restricted explicitly
        if not params:
            return available_models.values()

        return [
            available_models[model_name.lower()]
            for model_name in params.replace(',', ' ').split() if model_name.lower() in available_models
        ]

    def queryset_for_model(self, model, request=None):
        """
        Builds a search queryset for the given model class
        using the search terms from the request.
        """
        search_terms = self.get_search_terms(request)

        # there must be at least one search term, else return empty queryset for model
        if not search_terms:
            return model.objects.none()

        plain_search_terms = " ".join(search_terms)

        search_query = FollowedBySearchQuery(search_terms, config=models.F('fts_language'))
        queryset = model.objects.viewable().annotate(
            fts_rank=SearchRank(models.F('fts_index'), search_query)
        ).filter(
            Q(fts_index=search_query) | Q(fts_index__contains=plain_search_terms)
        ).order_by('-fts_rank')

        # do common prefetches on the querysets
        queryset = queryset.prefetch_common()

        # if the model has a "projects" attribute, prefetch this aswell
        if hasattr(model, 'projects'):
            queryset = queryset.prefetch_related('projects')

        return queryset[:self.search_limit_per_model]

    def serializer_for_instance(self, instance, request=None):
        """
        Gets the configured serializer for the model
        class of the given instance.
        """
        meta = instance._meta

        # log an error if there is a searchable model that does not specify a serializer
        if not hasattr(meta, "get_default_serializer"):
            logger.error(
                "Error in search: Meta [{meta}] of [{object}] does not have get_default_serializer method".format(
                    meta=meta,
                    object=instance
                )
            )
            return None

        serializer_class = meta.get_default_serializer()
        return serializer_class(instance=instance, context={'request': request})

    def get_results(self, request=None):
        """
        Searches on the selected models from the request using the search terms
        from the request. Returns a list of found objects.
        """
        searchable_models = self.get_search_models(request)

        models = apps.get_models(include_auto_created=False)
        models = [model for model in models if issubclass(model, FTSMixin) and model in searchable_models]

        querysets = [
            self.queryset_for_model(model, request=request)
            for model in models
        ]

        results = chain(*querysets)
        results = sorted(results, key=attrgetter('fts_rank'))

        return results

    def get_data(self, request=None):
        """
        Gets the serialized data for the search.
        """
        data = []
        results = self.get_results(request=request)

        for instance in results:
            serializer = self.serializer_for_instance(instance, request=request)
            if serializer:
                data.append(serializer.data)

        return data

    def list(self, request, *args, **kwargs):
        """
        Searches for elements.

        URL parameters:
            * search = you url-encoded search term
            * model = task | note | contact | ... (optional)
        """

        data = self.get_data(request=request)
        return Response(data)
