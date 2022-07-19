#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import operator
import six

from django.db.models import Q, F
from django.contrib.postgres.search import SearchQuery, SearchRank
from eric.search.models import FTSMixin
from functools import reduce
from rest_framework.filters import SearchFilter
from rest_framework.settings import api_settings
from rest_framework.compat import distinct

from eric.search.utils import convert_search_terms


class FTSSearchFilter(SearchFilter):
    # The URL query parameter used for the search.
    search_param = api_settings.SEARCH_PARAM
    template = 'rest_framework/filters/search.html'
    lookup_prefixes = {
        '^': 'istartswith',
        '=': 'iexact',
        '@': 'search',
        '$': 'iregex',
    }

    def get_search_terms(self, request):
        """
        Search terms are set by a ?search=... query parameter,
        and may be comma and/or whitespace delimited.
        """
        params = request.query_params.get(self.search_param, '')
        return [
            term.replace(':', '').replace('*', '')
            for term in params.replace(',', ' ').split() if term
        ]

    def apply_filters(self, queryset, search_fields, search_terms):
        if not search_fields or not search_terms:
            return queryset

        orm_lookups = [
            self.construct_search(six.text_type(search_field))
            for search_field in search_fields
        ]

        for search_term in search_terms:
            queries = [
                Q(**{orm_lookup: search_term})
                for orm_lookup in orm_lookups
            ]
            queryset = queryset.filter(reduce(operator.or_, queries))

        return queryset

    def apply_search(self, queryset, search_fields, search_terms):
        if not issubclass(queryset.model, FTSMixin) or not search_terms:
            return queryset

        plain_search_terms = convert_search_terms(search_terms)
        search_query = SearchQuery(plain_search_terms, config=F('fts_language'))

        queryset = queryset.annotate(
            fts_rank=SearchRank(F('fts_index'), search_query)
        ).filter(
            Q(fts_index=search_query) | Q(fts_index__contains=plain_search_terms)
        ).order_by('-fts_rank')

        return queryset

    def filter_queryset(self, request, queryset, view):
        search_fields = getattr(view, 'search_fields', None)
        search_terms = self.get_search_terms(request)

        base = queryset
        queryset = self.apply_filters(queryset, search_fields, search_terms)
        queryset = self.apply_search(queryset, search_fields, search_terms)

        if search_fields and self.must_call_distinct(queryset, search_fields):
            # Filtering against a many-to-many field requires us to
            # call queryset.distinct() in order to avoid duplicate items
            # in the resulting queryset.
            # We try to avoid this if possible, for performance reasons.
            queryset = distinct(queryset, base)

        return queryset
