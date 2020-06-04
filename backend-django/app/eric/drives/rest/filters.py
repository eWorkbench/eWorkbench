#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model

from eric.core.rest.filters import BaseFilter, BooleanDefaultFilter, ListFilter, RecursiveProjectsListFilter, \
    RecentlyModifiedByMeFilter
from eric.drives.models import Drive

User = get_user_model()


class DriveFilter(BaseFilter):
    class Meta:
        model = Drive
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS
        }

    deleted = BooleanDefaultFilter()

    projects = ListFilter(field_name='projects')

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')

    recently_modified_by_me = RecentlyModifiedByMeFilter()
