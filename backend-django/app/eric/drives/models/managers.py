#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.drives.models.querysets import DirectoryQuerySet, DriveQuerySet

DriveManager = BaseManager.from_queryset(DriveQuerySet)
DirectoryManager = BaseManager.from_queryset(DirectoryQuerySet)
