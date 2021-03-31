#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from admin_auto_filters.filters import AutocompleteFilter
from django.contrib import admin
from django_admin_listfilter_dropdown.filters import RelatedDropdownFilter

from eric.favourites.models.models import Favourite


class UserFilter(AutocompleteFilter):
    title = 'User'
    field_name = 'user'


@admin.register(Favourite)
class FavouriteAdmin(admin.ModelAdmin):
    list_display = (
        '__str__',
        'content_object',
    )
    search_fields = (
        'object_id',
        'user__username',
        'user__email',
        'user__userprofile__first_name',
        'user__userprofile__last_name',
    )
    list_filter = (
        UserFilter,
        ('content_type', RelatedDropdownFilter),
    )
    autocomplete_fields = (
        'user',
    )
    list_per_page = 20
