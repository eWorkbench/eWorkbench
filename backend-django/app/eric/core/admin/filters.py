#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.admin import SimpleListFilter


class IsSetListFilter(SimpleListFilter):
    """
    Admin list filter for related fields (there is a value / there is no value).
    """

    def lookups(self, request, model_admin):
        return (
            ('0', 'Is set',),
            ('1', 'Is not set',),
        )

    def queryset(self, request, queryset):
        if self.value() in ('0', '1'):
            kwargs = {
                f'{self.parameter_name}__isnull': self.value() == '1'
            }
            return queryset.filter(**kwargs)

        return queryset


def is_set_filter(field, title_=None):
    """
    Shortcut to IsSetListFilter.
    """

    class IsSetListFieldFilter(IsSetListFilter):
        parameter_name = field
        title = title_ or parameter_name

    return IsSetListFieldFilter
