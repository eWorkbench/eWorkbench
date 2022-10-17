#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import Q

import django_filters

from eric.core.rest.filters import BaseFilter
from eric.relations.models import Relation


class RelationFilter(BaseFilter):
    """Filters for relations"""

    class Meta:
        model = Relation
        fields = {
            "left_content_type": BaseFilter.FOREIGNKEY_COMPERATORS,
            "right_content_type": BaseFilter.FOREIGNKEY_COMPERATORS,
            "private": BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    with_content_type = django_filters.CharFilter(method="filter_with_content_type", label="With content type")
    without_content_type = django_filters.CharFilter(method="filter_without_content_type", label="Without content type")

    def filter_with_content_type(self, queryset, name, value):
        query = Q()
        for content_type_id in value.split(","):
            query |= Q(left_content_type=content_type_id) | Q(right_content_type=content_type_id)
        return queryset.filter(query)

    def filter_without_content_type(self, queryset, name, value):
        query = Q()
        for content_type_id in value.split(","):
            query |= Q(left_content_type=content_type_id) | Q(right_content_type=content_type_id)
        return queryset.exclude(query)
