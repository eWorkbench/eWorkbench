#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.db.models import Q

from django_changeset.models.queryset import ChangeSetQuerySetMixin
from django_userforeignkey.request import get_current_user

from eric.core.models import BaseQuerySet
from eric.projects.models.querysets import BaseProjectEntityPermissionQuerySet


class PluginQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    def viewable(self):
        """
        Viewable returns usable plugins for compatibility (for now).
        Strictly speaking all plugins are viewable.
        """
        return self.usable()

    def usable(self):
        """
        returns all elements of the model where
        - the element has user_availability set to global
        - the element has the current user in user_availability_selected_users
        - the element has at least one user group of the current user in user_availability_selected_user_groups
        """

        user = get_current_user()
        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()

        from eric.plugins.models import Plugin

        return self.filter(
            Q(
                # all plugins where user_availability is set to global
                user_availability=Plugin.GLOBAL
            )
            | Q(
                # all plugins where the current user is selected
                user_availability_selected_users=user
            )
            | Q(
                # all plugins where the user group of the current user is selected
                user_availability_selected_user_groups__pk__in=user.groups.values_list("pk")
            )
        ).distinct()


class PluginInstanceQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    def prefetch_common(self, *args, **kwargs):
        return super().prefetch_common().prefetch_metadata()
