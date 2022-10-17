#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from random import randint

from rest_framework import status

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR
from eric.projects.models import Resource
from eric.resources.models import DisplayDesign, StudyRoom

EXPORT_API_BASE = "/api/study-room-booking-export"


class StudyRoomExportMixin:
    """
    Utility mixin for APITestCase.
    Requires the following mixins:
     * CommonTestMixin
     * ResourceMixin
     * MeetingMixin
    """

    def rest_get_study_room_calendar_export(self, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """
        Resets the client credentials and GETs the calendar export as anonymous user.
        """
        self.client.credentials()

        return self.client.get(f"{EXPORT_API_BASE}/calendar/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_study_room_display_export(self, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """
        Resets the client credentials and GETs the display export as anonymous user.
        """
        self.client.credentials()

        return self.client.get(f"{EXPORT_API_BASE}/display/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def create_booking(self, auth_token, resource, start, end, title="Booking"):
        booking, response = self.create_meeting_orm(
            auth_token,
            project_pk=None,
            title=title,
            description="Test Description",
            start_date=start,
            end_date=end,
            resource_pk=resource.pk,
        )
        self.assert_response_status(response, status.HTTP_201_CREATED)
        self.assertIsNotNone(booking.resource)
        return booking

    def create_resource(self, auth_token, name, resource_type=Resource.ROOM):
        data = {
            "auth_token": auth_token,
            "project_pks": None,
            "name": name,
            "description": "Resource Description",
            "resource_type": resource_type,
            "general_usage_setting": Resource.GLOBAL,
        }

        resource, response = self.create_resource_orm(**data)
        self.assert_response_status(response, status.HTTP_201_CREATED)
        return resource

    def create_study_room(self, auth_token, name, display_design=None, **kwargs):
        resource = self.create_resource(auth_token, name, resource_type=Resource.ROOM)

        if not display_design:
            display_design = DisplayDesign.objects.all().first()

        data = {
            "resource": resource,
            "branch_library": StudyRoom.MAIN_CAMPUS,
            "room_id": randint(100, 10_000),
            "display_design": display_design,
            "is_bookable_by_students": True,
        }
        data.update(kwargs)
        StudyRoom.objects.create(**data)

        return resource

    @staticmethod
    def get_display_design(key):
        instance, created = DisplayDesign.objects.get_or_create(key=key)
        return instance
