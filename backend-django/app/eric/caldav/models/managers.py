#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.caldav.models.querysets import CaldavItemQuerySet
from eric.core.models import BaseManager

CaldavItemManager = BaseManager.from_queryset(CaldavItemQuerySet)
