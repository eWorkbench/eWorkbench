#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_userforeignkey.request import get_current_user

from eric.projects.models.querysets import BaseQuerySet


class ShortURLQuerySet(BaseQuerySet):
    """
    Only the current user is allowed to view, edit and delete short urls that they created
    """

    def viewable(self, *args, **kwargs):
        return self.filter(created_by=get_current_user())

    def editable(self, *args, **kwargs):
        return self.filter(created_by=get_current_user())

    def deletable(self, *args, **kwargs):
        return self.filter(created_by=get_current_user())
