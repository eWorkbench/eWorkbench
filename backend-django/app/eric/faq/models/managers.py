#
# Copyright (C) 2016-2021 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.faq.models.querysets import FAQQuestionAndAnswerQuerySet, FAQCategoryQuerySet

FAQQuestionAndAnswerManager = BaseManager.from_queryset(FAQQuestionAndAnswerQuerySet)
FAQCategoryManager = BaseManager.from_queryset(FAQCategoryQuerySet)
