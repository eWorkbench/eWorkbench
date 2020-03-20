#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_userforeignkey.request import get_current_user

from eric.core.models import BaseQuerySet


class MenuEntryQuerySet(BaseQuerySet):
    """
    QuerySet for MenuEntries

    The user that owns the element can view, edit and delete it
    """

    def private(self, *args, **kwargs):
        return self.filter(visible=False)

    def published(self, *args, **kwargs):
        return self.filter(visible=True)

    def viewable(self, *args, **kwargs):
        user = get_current_user()

        return self.filter(owner=user)

    def editable(self, *args, **kwargs):
        user = get_current_user()

        return self.filter(owner=user)

    def deletable(self, *args, **kwargs):
        user = get_current_user()

        return self.filter(owner=user)


class MenuEntryParameterQuerySet(BaseQuerySet):
    """
    QuerySet for Menu Entry Parameters
    The user that owns the menu entry can edit the parameters
    """

    def viewable(self, *args, **kwargs):
        user = get_current_user()

        return self.filter(menu_entry__owner=user)

    def editable(self, *args, **kwargs):
        user = get_current_user()

        return self.filter(menu_entry__owner=user)

    def deletable(self, *args, **kwargs):
        user = get_current_user()

        return self.filter(menu_entry__owner=user)
