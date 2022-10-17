#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
from datetime import date, datetime

from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

import pytz
from django_cleanhtmlfield.helpers import convert_text_to_html
from django_userforeignkey.request import get_current_user
from radicale import ical

from eric.caldav.models import CaldavItem
from eric.caldav.utils import create_or_update_caldav_item_for_meeting
from eric.caldav.wrappers import VEventWrapper
from eric.shared_elements.models import ContactAttendsMeeting, Meeting, UserAttendsMeeting, vobject

LOGGER = logging.getLogger(__name__)


class MeetingSynchronizer:
    """
    Creates or updates meeting models for changes from CalDav.
    Hint: CaldavItems are created automatically for meetings on save (see models/handlers.py).
    """

    current_timezone = None

    def create_or_update(self, name, new_items):
        """
        Entry point: Called from storage.Collection.append() and .replace()
        """
        self.current_timezone = self.get_timezone(new_items)
        for new_item in new_items:
            if new_item.tag != ical.Timezone.tag:
                self.create_or_update_item(name, new_item)

    def create_or_update_item(self, name, new_item):
        # parse the ical text using vobject
        input_event = VEventWrapper(vobject.readOne(new_item.text))

        caldav_item = CaldavItem.objects.filter(id=input_event.read("uid"), name=name).first()

        # we can't represent recurring events in the workbench yet
        # therefore we ignore them in the CalDav sync for now
        # ---
        # but we can't completely ignore them, because the plugin will report an error, if the server
        # does not acknowledge the event
        # therefore we store the CalDav item, but we do not create a meeting for it
        is_recurring_event = input_event.contains("rrule") or input_event.contains("recurrence-id")

        try:
            if is_recurring_event:
                self.update_recurring_event(caldav_item, input_event, name)
            else:
                self.update_single_event(caldav_item, input_event, name)
        except PermissionDenied:
            meeting = caldav_item.meeting if caldav_item and caldav_item.meeting else None
            LOGGER.info(
                "User <{username}> tried to create/edit an event via Caldav but had no permission to do so.".format(
                    username=get_current_user().username
                )
            )
            if caldav_item:
                LOGGER.info(
                    "CaldavItem: ID: <{id}> Name: <{name}>".format(
                        id=caldav_item.pk,
                        name=caldav_item.name,
                    )
                )
            if meeting:
                LOGGER.info(
                    "Appointment: ID: <{id}> Name: <{title}>".format(
                        id=meeting.pk,
                        title=meeting.title,
                    )
                )

    @staticmethod
    def update_recurring_event(caldav_item, input_event, name):
        if not caldav_item:
            id = input_event.read("uid")

            # for recurring events there might be an item with the same name or ID already
            # but we don't support that yet => ignore those
            items_with_same_id = CaldavItem.objects.filter(id=id)
            items_with_same_name = CaldavItem.objects.filter(name=name)

            if not items_with_same_name.exists() and not items_with_same_id.exists():
                caldav_item = CaldavItem.objects.create(
                    id=id,
                    name=name,
                    text=input_event.v_object.serialize(),
                )
                caldav_item.save()

    def update_single_event(self, caldav_item, input_event, name):
        if caldav_item and caldav_item.meeting:
            meeting = caldav_item.meeting
        else:
            meeting = Meeting()

        self.update_meeting(meeting, input_event)
        create_or_update_caldav_item_for_meeting(meeting, name=name)

    def update_meeting(self, meeting, input_event):
        summary = input_event.read("summary")
        if len(summary) > 128:
            summary = summary[:128]
        meeting.title = summary
        if not meeting.title:
            meeting.title = _("No Subject")
        meeting.location = input_event.read("location")

        # process dtstart and dtend: make sure they are timezone aware datetime objects
        meeting.date_time_start = self.process_datetime(input_event.read("dtstart"))

        # workbench specifies events as (start-inclusive, end-inclusive)
        # caldav specifies events as (start-inclusive, end-exclusive)
        end_exclusive = self.process_datetime(input_event.read("dtend"))
        # TODO: Consistent handling for different time definitions
        meeting.date_time_end = end_exclusive  # - timedelta(minutes=1)

        # we use the text description only, for now
        # other formats can be read like:
        # ---
        # format_type = input_event.read_param('x-alt-desc', 'FMTTYPE')
        # if format_type == 'text/html':
        #     html_description = input_event.read('x-alt-desc')
        #     if len(html_description) > 0:
        #         description = html_description
        # ---

        meeting.text = convert_text_to_html(input_event.read("description", default=""))

        # save() must be called before updating the attendees, so the meeting exists when M2M relations are created
        meeting.save()

        # ToDo: Analyse problematic cases for contact sync + fix them
        # Do not sync attendees for now, since the contact sync does not always work as expected
        # self.update_meeting_attendees(meeting, input_event)

        self.add_current_user_to_attending_users(meeting)

        # now that all meeting information is saved, make sure that we re-generate the ical information
        meeting.export_as_ical(event=input_event.v_object)

    @staticmethod
    def add_current_user_to_attending_users(meeting):
        UserAttendsMeeting.objects.get_or_create(meeting=meeting, user_id=get_current_user().pk)

    def update_meeting_attendees(self, meeting, input_event):
        if input_event.contains("attendee"):
            contact_pk_list, user_pk_list = input_event.read_attendees()
            self.update_attending_users(meeting, user_pk_list)
            self.update_attending_contacts(meeting, contact_pk_list)

    @staticmethod
    def update_attending_users(meeting, pk_list):
        # remove all attending users of this meeting that are not listed in pk_list
        UserAttendsMeeting.objects.filter(meeting=meeting).exclude(user__pk__in=pk_list).exclude(
            user__pk=get_current_user().pk
        ).delete()

        # make sure that all users in pk_list are attending
        for user_pk in pk_list:
            UserAttendsMeeting.objects.get_or_create(meeting=meeting, user_id=user_pk)

    @staticmethod
    def update_attending_contacts(meeting, pk_list):
        # remove all attending contacts of this meeting if they are not listed in pk_list
        ContactAttendsMeeting.objects.filter(meeting=meeting).exclude(contact__pk__in=pk_list).delete()

        # make sure that all contacts in pk_list are attending
        for contact_pk in pk_list:
            ContactAttendsMeeting.objects.get_or_create(
                meeting=meeting,
                contact_id=contact_pk,
            )

    @staticmethod
    def get_timezone(new_items):
        timezones = list(filter(lambda x: x.tag == ical.Timezone.tag, new_items))

        active_tz = None
        if len(timezones) > 0:
            first_tz = timezones[0]
            try:
                active_tz = pytz.timezone(first_tz.name.replace("/freeassociation.sourceforge.net/", ""))
            except Exception:
                print(f"Unknown timezone {first_tz.name}")

        return active_tz or timezone.get_default_timezone()

    def process_datetime(self, dt_object):
        """
        Ensures the datetime-object is a datetime (not a date) and timezone aware.
        """
        if isinstance(dt_object, date) and not isinstance(dt_object, datetime):
            dt_object = datetime.combine(dt_object, datetime.min.time())

        if timezone.is_naive(dt_object):
            dt_object = timezone.make_aware(dt_object, self.current_timezone)

        return dt_object
