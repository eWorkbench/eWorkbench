#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.sortable_menu.models.querysets import MenuEntryParameterQuerySet, MenuEntryQuerySet

MenuEntryManager = BaseManager.from_queryset(MenuEntryQuerySet)
MenuEntryParameterManager = BaseManager.from_queryset(MenuEntryParameterQuerySet)
