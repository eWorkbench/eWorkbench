#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.labbooks.models.querysets import LabBookChildElementQuerySet, LabBookQuerySet, LabbookSectionQuerySet

LabBookManager = BaseManager.from_queryset(LabBookQuerySet)
LabBookChildElementManager = BaseManager.from_queryset(LabBookChildElementQuerySet)
LabbookSectionManager = BaseManager.from_queryset(LabbookSectionQuerySet)
