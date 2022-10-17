#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import Q

from django_changeset.models.queryset import ChangeSetQuerySetMixin
from django_userforeignkey.request import get_current_user

from eric.core.models import BaseQuerySet


class NotificationConfigurationQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    """
    Notification Configuration is viewable and editable by the current user
    """

    def viewable(self, *args, **kwargs):
        return self.filter(user=get_current_user())

    def editable(self, *args, **kwargs):
        return self.filter(user=get_current_user())

    def deletable(self, *args, **kwargs):
        return self.none()


class NotificationQuerySet(BaseQuerySet):
    """
    Notification QuerySet allows viewing notifications of the current user
    it also allows editing notifications IF the notification was created by the current user or is for the current user
    """

    def viewable(self, *args, **kwargs):
        return self.filter(user=get_current_user())

    def editable(self, *args, **kwargs):
        """
        The current user may update its own notifications (e.g., read)
        and the user that created a notification may update it
        :param args:
        :param kwargs:
        :return:
        """
        return self.filter(Q(user=get_current_user()) | Q(created_by=get_current_user()))

    def deletable(self, *args, **kwargs):
        return self.none()


class ScheduledNotificationQuerySet(BaseQuerySet):
    """
    Scheduled Notification QuerySet
    If the related Meeting is viewable, so is the Scheduled Notification etc.
    """

    def viewable(self, *args, **kwargs):
        from eric.shared_elements.models import Meeting

        return self.filter(object_id__in=Meeting.objects.viewable().values_list("pk"))

    def editable(self, *args, **kwargs):
        from eric.shared_elements.models import Meeting

        return self.filter(object_id__in=Meeting.objects.editable().values_list("pk"))

    def deletable(self, *args, **kwargs):
        return self.none()
