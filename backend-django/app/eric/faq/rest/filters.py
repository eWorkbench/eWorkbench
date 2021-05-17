#
# Copyright (C) 2016-2021 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import BaseFilter
from eric.faq.models import FAQQuestionAndAnswer


class FAQQuestionAndAnswerFilter(BaseFilter):
    class Meta:
        model = FAQQuestionAndAnswer
        fields = {
            'category__slug': BaseFilter.FOREIGNKEY_COMPERATORS,
            'public': BaseFilter.FOREIGNKEY_COMPERATORS,
            'category__public': BaseFilter.FOREIGNKEY_COMPERATORS,
        }
