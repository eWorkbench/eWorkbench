#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.caldav.models.querysets import CaldavItemQuerySet

CaldavItemManager = BaseManager.from_queryset(CaldavItemQuerySet)
