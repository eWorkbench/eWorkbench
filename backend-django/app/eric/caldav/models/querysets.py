#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_userforeignkey.request import get_current_user
from django.db.models import Q

from eric.projects.models.querysets import BaseProjectEntityPermissionQuerySet


class CaldavItemQuerySet(BaseProjectEntityPermissionQuerySet):
    """
    Base QuerySet for Caldav Item, which is directly related to a meeting
    """

    def viewable(self, *args, **kwargs):
        """
        Returns all elements where the current user is attending,
        the current user is the organizer,
        or recurring CalDav items where the current user is the creator
        """
        from eric.shared_elements.models import Meeting
        user = get_current_user()

        if user.is_anonymous:
            return self.none()

        return self.filter(
            Q(
                # all CaldavItems where the current user is attending
                meeting__pk__in=Meeting.objects.attending().values_list('pk')
            ) | Q(
                # all CaldavItems where the current user is the organizer
                meeting__created_by=user
            ) | Q(
                # all CaldavItems where meeting is null
                # currently needed to sync recurring items, as they have no meeting, but should still be synced
                created_by=user,
                meeting__isnull=True,
                text__icontains='rrule'
            ) | Q(
                # all CaldavItems where meeting is null
                # currently needed to sync recurring items, as they have no meeting, but should still be synced
                created_by=user,
                meeting__isnull=True,
                text__icontains='recurrence-id'
            )
        )

    def editable(self, *args, **kwargs):
        """
        Returns all element where the related meeting is editable
        """
        from eric.shared_elements.models import Meeting

        return self.filter(meeting__pk__in=Meeting.objects.editable().values_list('pk'))

    def deletable(self, *args, **kwargs):
        """
        Returns all element where the related meeting is editable (! editable is used on purpose here)
        """
        from eric.shared_elements.models import Meeting

        return self.filter(meeting__pk__in=Meeting.objects.editable().values_list('pk'))
