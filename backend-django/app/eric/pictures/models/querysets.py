#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django_changeset.models.queryset import ChangeSetQuerySetMixin

from eric.projects.models.querysets import BaseProjectEntityPermissionQuerySet

logger = logging.getLogger(__name__)


class PictureQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        """
        return super().prefetch_common().prefetch_metadata()
