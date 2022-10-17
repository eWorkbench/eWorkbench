#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for shared elements """
from django.conf.urls import include
from django.urls import re_path

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.projects.rest.viewsets import GenericChangeSetViewSet

# relations
from eric.relations.rest.viewsets import RelationViewSet
from eric.shared_elements.rest.viewsets import (
    CalendarAccessViewSet,
    ContactViewSet,
    ElementLabelViewSet,
    FileViewSet,
    MeetingViewSet,
    MyMeetingViewSet,
    MyScheduleViewSet,
    MyTaskViewSet,
    NoteViewSet,
    TaskViewSet,
)

# register REST API Routers
from eric.shared_elements.rest.viewsets.comment import CommentViewSet
from eric.shared_elements.rest.viewsets.contact import ContactShareViewSet
from eric.shared_elements.rest.viewsets.meeting import (
    AllResourceBookingViewSet,
    EditorResourceBookingViewSet,
    MyResourceBookingViewSet,
)

router = get_api_router()


# personal data routes
router.register(r"my/meetings", MyMeetingViewSet, basename="mymeeting")
router.register(r"my/tasks", MyTaskViewSet, basename="mytask")
# my schedule (contains all entities that have dates set and should be displayed in a calendar)
router.register(r"my/schedule", MyScheduleViewSet, basename="myschedule")

"""
Calendar Access Privileges
with privileges
"""
router.register(r"calendar-access-privileges", CalendarAccessViewSet, basename="calendaraccess")

calendar_access_privileges_router = routers.NestedSimpleRouter(
    router, r"calendar-access-privileges", lookup="calendaraccess"
)
calendar_access_privileges_router.register(r"privileges", ModelPrivilegeViewSet, basename="calendaraccess-privileges")


"""
Contacts
with history and relations
"""
router.register(r"contacts", ContactViewSet, basename="contact")

contacts_router = routers.NestedSimpleRouter(router, r"contacts", lookup="contact")
contacts_router.register(r"relations", RelationViewSet, basename="contact-relation")
contacts_router.register(r"history", GenericChangeSetViewSet, basename="contact-changeset-paginated")
contacts_router.register(r"privileges", ModelPrivilegeViewSet, basename="contact-privileges")

router.register(r"sharecontact", ContactShareViewSet, basename="sharecontact")

"""
Tasks
with history and relations
"""
router.register(r"tasks", TaskViewSet, basename="task")

tasks_router = routers.NestedSimpleRouter(router, r"tasks", lookup="task")
tasks_router.register(r"relations", RelationViewSet, basename="task-relation")
tasks_router.register(r"history", GenericChangeSetViewSet, basename="task-changeset-paginated")
tasks_router.register(r"privileges", ModelPrivilegeViewSet, basename="task-privileges")


"""
Files
with history and relations
"""
router.register(r"files", FileViewSet, basename="file")

files_router = routers.NestedSimpleRouter(router, r"files", lookup="file")
files_router.register(r"relations", RelationViewSet, basename="file-relation")
files_router.register(r"history", GenericChangeSetViewSet, basename="file-changeset-paginated")
files_router.register(r"privileges", ModelPrivilegeViewSet, basename="file-privileges")


"""
Notes
with history and relations
"""
router.register(r"notes", NoteViewSet, basename="note")

notes_router = routers.NestedSimpleRouter(router, r"notes", lookup="note")
notes_router.register(r"relations", RelationViewSet, basename="note-relation")
notes_router.register(r"history", GenericChangeSetViewSet, basename="note-changeset-paginated")
notes_router.register(r"privileges", ModelPrivilegeViewSet, basename="note-privileges")

"""
Comments
with history and relations
"""
router.register(r"comments", CommentViewSet, basename="comment")

comments_router = routers.NestedSimpleRouter(router, r"comments", lookup="comment")
comments_router.register(r"relations", RelationViewSet, basename="comment-relation")
comments_router.register(r"history", GenericChangeSetViewSet, basename="comment-changeset-paginated")
comments_router.register(r"privileges", ModelPrivilegeViewSet, basename="comment-privileges")


"""
Meetings
with history and relations
and attending contacts and attending users
"""
router.register(r"meetings", MeetingViewSet, basename="meeting")

meetings_router = routers.NestedSimpleRouter(router, r"meetings", lookup="meeting")
meetings_router.register(r"relations", RelationViewSet, basename="meeting-relation")
meetings_router.register(r"history", GenericChangeSetViewSet, basename="meeting-changeset-paginated")
# meetings_router.register(r'attending_contacts', ContactAttendsMeetingViewSet, basename='contactattendsmeeting')
# meetings_router.register(r'attending_users', UserAttendsMeetingViewSet, basename='userattendsmeeting')
meetings_router.register(r"privileges", ModelPrivilegeViewSet, basename="meeting-privileges")

"""
Resource Bookings
"""
router.register(r"resourcebookings/my", MyResourceBookingViewSet, basename="myresourcebooking")
router.register(r"resourcebookings/all", AllResourceBookingViewSet, basename="allresourcebooking")
router.register(r"resourcebookings/editor", EditorResourceBookingViewSet, basename="editorresourcebooking")

"""
Element Labels (generic endpoint)
"""
router.register(r"element_labels", ElementLabelViewSet, basename="element_labels")


urlpatterns = [
    # REST Endpoints for contacts (history, relations)
    re_path(r"^", include(contacts_router.urls)),
    # REST Endpoints for tasks (history, relations)
    re_path(r"^", include(tasks_router.urls)),
    # REST Endpoints for files (history, relations)
    re_path(r"^", include(files_router.urls)),
    # REST Endpoints for notes (history, relations)
    re_path(r"^", include(notes_router.urls)),
    # REST Endpoints for comments (history, relations)
    re_path(r"^", include(comments_router.urls)),
    # REST Endpoints for meetings  (history, relations)
    re_path(r"^", include(meetings_router.urls)),
    # REST Endpoints for calendar_access_privileges  (privileges)
    re_path(r"^", include(calendar_access_privileges_router.urls)),
]
