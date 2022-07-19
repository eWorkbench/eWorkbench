#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_changeset.models.queryset import ChangeSetQuerySetMixin
from django_userforeignkey.request import get_current_user

from eric.projects.models.querysets import BaseQuerySet


class FavouriteQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    def viewable(self, *args, **kwargs):
        """
        Favourites are only viewable if the current user is the owner
        """
        return self.for_current_user()

    def editable(self, *args, **kwargs):
        """
        Favourites are only editable if the current user is the owner
        """
        return self.for_current_user()

    def deletable(self, *args, **kwargs):
        """
        Favourites are only deletable if the current user is the owner
        """
        return self.for_current_user()

    def for_current_user(self):
        user = get_current_user()
        if user.is_anonymous:
            return self.none()
        return self.filter(user=user)

    def for_content_type(self, content_type, *args, **kwargs):
        """
        Favourites for the specified content_type
        """
        return self.filter(content_type=content_type)
