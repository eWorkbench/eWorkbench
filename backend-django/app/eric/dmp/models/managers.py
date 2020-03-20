#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.dmp.models.querysets import DmpFormDataQuerySet, DmpFormFieldQuerySet, DmpFormQuerySet, DmpQuerySet

DmpManager = BaseManager.from_queryset(DmpQuerySet)
DmpFormManager = BaseManager.from_queryset(DmpFormQuerySet)
DmpFormFieldManager = BaseManager.from_queryset(DmpFormFieldQuerySet)
DmpFormDataManager = BaseManager.from_queryset(DmpFormDataQuerySet)
