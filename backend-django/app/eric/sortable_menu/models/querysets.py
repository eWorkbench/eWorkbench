#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
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
        return self.for_current_user()

    def editable(self, *args, **kwargs):
        return self.for_current_user()

    def deletable(self, *args, **kwargs):
        return self.for_current_user()

    def for_current_user(self):
        user = get_current_user()
        if user.is_anonymous:
            return self.none()
        return self.filter(owner=user)


class MenuEntryParameterQuerySet(BaseQuerySet):
    """
    QuerySet for Menu Entry Parameters
    The user that owns the menu entry can edit the parameters
    """

    def viewable(self, *args, **kwargs):
        return self.for_current_user()

    def editable(self, *args, **kwargs):
        return self.for_current_user()

    def deletable(self, *args, **kwargs):
        return self.for_current_user()

    def for_current_user(self):
        user = get_current_user()
        if user.is_anonymous:
            return self.none()
        return self.filter(menu_entry__owner=user)
