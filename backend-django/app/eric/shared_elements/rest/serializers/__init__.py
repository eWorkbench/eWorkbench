#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.shared_elements.rest.serializers.contact import ContactSerializer, MinimalisticContactSerializer
from eric.shared_elements.rest.serializers.element_label import ElementLabelSerializer
from eric.shared_elements.rest.serializers.file import FileSerializer, UploadedFileEntrySerializer
from eric.shared_elements.rest.serializers.meeting import MeetingSerializer, MinimalisticMeetingSerializer
from eric.shared_elements.rest.serializers.note import NoteSerializer
from eric.shared_elements.rest.serializers.calendar_access_privileges import CalendarAccessSerializer
from eric.shared_elements.rest.serializers.task import TaskSerializer, MinimalisticTaskSerializer, \
    TaskCheckListItemSerializer
