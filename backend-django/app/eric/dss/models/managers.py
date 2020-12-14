#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.dss.models.querysets import DSSEnvelopeQuerySet, DSSContainerQuerySet, DSSFilesToImportQuerySet

DSSEnvelopeManager = BaseManager.from_queryset(DSSEnvelopeQuerySet)
DSSContainerManager = BaseManager.from_queryset(DSSContainerQuerySet)
DSSFilesToImportManager = BaseManager.from_queryset(DSSFilesToImportQuerySet)
