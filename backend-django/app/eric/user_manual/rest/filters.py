#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import BaseFilter
from eric.user_manual.models import UserManualHelpText


class UserManualHelpTextFilter(BaseFilter):
    class Meta:
        model = UserManualHelpText
        fields = {
            'category': BaseFilter.FOREIGNKEY_COMPERATORS
        }
