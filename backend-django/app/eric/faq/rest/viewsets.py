#
# Copyright (C) 2016-2021 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.faq.models import FAQQuestionAndAnswer
from eric.faq.rest.filters import FAQQuestionAndAnswerFilter
from eric.faq.rest.serializers import FAQQuestionAndAnswerSerializer


class FAQQuestionAndAnswerViewSet(BaseAuthenticatedModelViewSet):
    serializer_class = FAQQuestionAndAnswerSerializer
    filterset_class = FAQQuestionAndAnswerFilter
    search_fields = ('question', 'answer', 'category__title', 'category__slug')
    ordering_fields = ('ordering',)
    permission_classes = ()
    http_method_names = ('get', 'head', 'options',)

    def get_queryset(self):
        return FAQQuestionAndAnswer.objects.viewable().filter(public=True).prefetch_common()
