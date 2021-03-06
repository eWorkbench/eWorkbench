#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import BaseFilter, WorkbenchElementFilter

from eric.dmp.models import Dmp


class DmpFilter(WorkbenchElementFilter):
    """ Filter for Dmps, which allows filtering for the project (foreign key) """

    class Meta:
        model = Dmp
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS
        }
