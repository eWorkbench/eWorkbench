#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.routers import get_api_router
from eric.faq.rest.viewsets import FAQQuestionAndAnswerViewSet

router = get_api_router()

router.register(r"faq", FAQQuestionAndAnswerViewSet, basename="faq")

urlpatterns = []
