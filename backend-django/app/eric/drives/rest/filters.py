#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django_filters

from eric.core.rest.filters import BaseFilter, WorkbenchElementFilter, RecursiveProjectsListFilter
from eric.drives.models import Drive
from eric.dss.models import DSSContainer


class DriveFilter(WorkbenchElementFilter):
    class Meta:
        model = Drive
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS
        }

    container = django_filters.ModelChoiceFilter(field_name='envelope__container', queryset=DSSContainer.objects.all())
    projects_recursive = RecursiveProjectsListFilter(field_name='projects')
