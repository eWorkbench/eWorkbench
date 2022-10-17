#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_changeset.models.queryset import ChangeSetQuerySetMixin

from eric.core.models import BaseQuerySet


class MetadataQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Metadata
    """

    def viewable(self, *args, **kwargs):
        # Metadata is provided and saved with a specific Workbench Entity which does these checks already
        return self.all()

    def editable(self, *args, **kwargs):
        # Metadata is provided and saved with a specific Workbench Entity which does these checks already
        return self.all()

    def deletable(self, *args, **kwargs):
        # Metadata is provided and saved with a specific Workbench Entity which does these checks already
        return self.all()
