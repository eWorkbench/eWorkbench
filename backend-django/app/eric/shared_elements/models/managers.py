#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.shared_elements.models.querysets import (
    CalendarAccessQuerySet,
    CommentQuerySet,
    ContactAttendsMeetingQuerySet,
    ContactQuerySet,
    ElementLabelQuerySet,
    FileQuerySet,
    MeetingQuerySet,
    NoteQuerySet,
    TaskAssignedUserQuerySet,
    TaskCheckListQuerySet,
    TaskQuerySet,
    UserAttendsMeetingQuerySet,
)

ContactManager = BaseManager.from_queryset(ContactQuerySet)
ElementLabelManager = BaseManager.from_queryset(ElementLabelQuerySet)
NoteManager = BaseManager.from_queryset(NoteQuerySet)
CommentManager = BaseManager.from_queryset(CommentQuerySet)
FileManager = BaseManager.from_queryset(FileQuerySet)
TaskManager = BaseManager.from_queryset(TaskQuerySet)
TaskAssignedUserManager = BaseManager.from_queryset(TaskAssignedUserQuerySet)
TaskCheckListManager = BaseManager.from_queryset(TaskCheckListQuerySet)
MeetingManager = BaseManager.from_queryset(MeetingQuerySet)
UserAttendsMeetingManager = BaseManager.from_queryset(UserAttendsMeetingQuerySet)
ContactAttendsMeetingManager = BaseManager.from_queryset(ContactAttendsMeetingQuerySet)
CalendarAccessManager = BaseManager.from_queryset(CalendarAccessQuerySet)
