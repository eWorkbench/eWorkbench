#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.db import models
from django.urls import reverse
from django.utils.timezone import now
from django.utils.translation import ugettext_lazy as _
from django_changeset.models import CreatedModifiedByMixin
from django_userforeignkey.models.fields import UserForeignKey
from django_userforeignkey.request import get_current_user

from eric.caldav.models.managers import CaldavItemManager


def get_default_caldav_item_uid():
    """
    Generate a unique name for a caldav item
    This concists of the current time and a UUID
    :return:
    """
    return "{}-{}@workbench".format(now(), uuid.uuid4())


class CaldavItem(CreatedModifiedByMixin):
    objects = CaldavItemManager()

    class Meta:
        ordering = 'last_modified_at',
        verbose_name = _('CalDav Item')
        verbose_name_plural = _('CalDav Items')

    # unique identifier
    # (either from the caldav/ical item uid, or automatically generated using get_default_caldav_item_uid)
    id = models.CharField(
        _('CalDav Item Unique Identifier'),
        max_length=255,
        primary_key=True,
        default=get_default_caldav_item_uid
    )

    # name of the ical file (should be unique)
    name = models.CharField(
        verbose_name=_('Name of the ICAL File'),
        max_length=255,
        unique=True
    )

    # the ical information for this item
    text = models.TextField(
        verbose_name=_('ICAL File Content')
    )

    meeting = models.OneToOneField(
        "shared_elements.Meeting",
        on_delete=models.CASCADE,
        null=True
    )

    # whether this item has been deleted via caldav (+ stored as timestamp when it was deleted via caldav)
    deleted_via_caldav_on = models.DateTimeField(
        verbose_name=_("Whether this item was deleted via CalDav (and when)"),
        default=None,
        null=True
    )
    deleted_via_caldav_by = UserForeignKey(
        verbose_name=_("The user that deleted the item via CalDav"),
        default=None,
        null=True,
    )

    @property
    def was_deleted(self):
        return self.deleted_via_caldav_on is not None

    def set_deleted(self, deleted=True):
        if deleted:
            self.deleted_via_caldav_on = now()
            self.deleted_via_caldav_by = get_current_user()
        else:
            self.deleted_via_caldav_on = None
            self.deleted_via_caldav_by = None

    def get_absolute_url(self):
        return reverse('djradicale:application', kwargs={
            'url': self.path,
        })

    def __str__(self):
        return self.name

    @property
    def fn(self):
        # ToDo: What does this button do...
        return self._get_field('FN')

    @property
    def path(self):
        return '%s/%s' % ('default', self.name)
