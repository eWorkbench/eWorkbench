#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django_filters
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils.translation import gettext
from django_filters.constants import EMPTY_VALUES

from eric.favourites.models.models import Favourite


class FavouriteFilter(django_filters.BooleanFilter):
    """
    A custom filter which returns a users favourites of an element
    """

    def __init__(self, *args, **kwargs):
        # gettext_lazy breaks the OpenAPI generation => use gettext instead
        kwargs['label'] = gettext("My favourites")
        super(FavouriteFilter, self).__init__(*args, **kwargs)

    def filter(self, qs, value):
        content_type = ContentType.objects.get_for_model(qs.model)
        favourites = Favourite.objects.viewable().for_content_type(content_type)
        is_favourite = Q(pk__in=favourites.values('object_id'))
        if value in EMPTY_VALUES:
            return qs
        elif value:
            return qs.filter(is_favourite)
        else:
            return qs.exclude(is_favourite)
