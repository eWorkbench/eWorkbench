#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.faq.models.querysets import FAQCategoryQuerySet, FAQQuestionAndAnswerQuerySet

FAQQuestionAndAnswerManager = BaseManager.from_queryset(FAQQuestionAndAnswerQuerySet)
FAQCategoryManager = BaseManager.from_queryset(FAQCategoryQuerySet)
