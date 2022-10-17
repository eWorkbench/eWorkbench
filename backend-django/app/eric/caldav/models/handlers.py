#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models.signals import post_save
from django.dispatch import receiver

from eric.caldav.utils import create_or_update_caldav_item_for_meeting
from eric.shared_elements.models import ContactAttendsMeeting, Meeting, UserAttendsMeeting


@receiver(post_save)
def auto_create_or_update_caldav_item_for_meeting(instance, created, *args, **kwargs):
    """
    After a meeting was created or updated, we need to make sure it has a CaldavItem and that the ical text is set
    properly
    """
    if isinstance(instance, Meeting):
        meeting = instance
    elif isinstance(instance, UserAttendsMeeting) or isinstance(instance, ContactAttendsMeeting):
        meeting = instance.meeting
    else:
        # ignore
        return

    create_or_update_caldav_item_for_meeting(meeting)
