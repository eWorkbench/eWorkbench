#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for shared elements """
from django.conf.urls import url, include

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router

from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet

# relations
from eric.relations.rest.viewsets import RelationViewSet

from eric.shared_elements.rest.viewsets import ContactViewSet, NoteViewSet, FileViewSet, TaskViewSet, \
    MeetingViewSet, MyTaskViewSet, MyScheduleViewSet, MyMeetingViewSet, ElementLabelViewSet

# register REST API Routers
from eric.shared_elements.rest.viewsets.contact import ContactShareViewSet

router = get_api_router()


# personal data routes
router.register(r'my/meetings', MyMeetingViewSet, base_name='mymeeting')
router.register(r'my/tasks', MyTaskViewSet, base_name='mytask')
# my schedule (contains all entities that have dates set and should be displayed in a calendar)
router.register(r'my/schedule', MyScheduleViewSet, base_name='myschedule')


"""
Contacts
with history and relations
"""
router.register(r'contacts', ContactViewSet, base_name='contact')

contacts_router = routers.NestedSimpleRouter(router, r'contacts', lookup='contact')
contacts_router.register(r'relations', RelationViewSet, base_name='contact-relation')
contacts_router.register(r'history', GenericChangeSetViewSet,
                         base_name='contact-changeset-paginated')
contacts_router.register(r'privileges', ModelPrivilegeViewSet, base_name='contact-privileges')

router.register(r'sharecontact', ContactShareViewSet, base_name='sharecontact')

"""
Tasks
with history and relations
"""
router.register(r'tasks', TaskViewSet, base_name='task')

tasks_router = routers.NestedSimpleRouter(router, r'tasks', lookup='task')
tasks_router.register(r'relations', RelationViewSet, base_name='task-relation')
tasks_router.register(r'history', GenericChangeSetViewSet,
                      base_name='task-changeset-paginated')
tasks_router.register(r'privileges', ModelPrivilegeViewSet, base_name='task-privileges')


"""
Files
with history and relations
"""
router.register(r'files', FileViewSet, base_name='file')

files_router = routers.NestedSimpleRouter(router, r'files', lookup='file')
files_router.register(r'relations', RelationViewSet, base_name='file-relation')
files_router.register(r'history', GenericChangeSetViewSet,
                      base_name='file-changeset-paginated')
files_router.register(r'privileges', ModelPrivilegeViewSet, base_name='file-privileges')


"""
Notes
with history and relations
"""
router.register(r'notes', NoteViewSet, base_name='note')

notes_router = routers.NestedSimpleRouter(router, r'notes', lookup='note')
notes_router.register(r'relations', RelationViewSet, base_name='note-relation')
notes_router.register(r'history', GenericChangeSetViewSet,
                      base_name='note-changeset-paginated')
notes_router.register(r'privileges', ModelPrivilegeViewSet, base_name='note-privileges')


"""
Meetings
with history and relations
and attending contacts and attending users
"""
router.register(r'meetings', MeetingViewSet, base_name='meeting')

meetings_router = routers.NestedSimpleRouter(router, r'meetings', lookup='meeting')
meetings_router.register(r'relations', RelationViewSet, base_name='meeting-relation')
meetings_router.register(r'history', GenericChangeSetViewSet,
                         base_name='meeting-changeset-paginated')
# meetings_router.register(r'attending_contacts', ContactAttendsMeetingViewSet, base_name='contactattendsmeeting')
# meetings_router.register(r'attending_users', UserAttendsMeetingViewSet, base_name='userattendsmeeting')
meetings_router.register(r'privileges', ModelPrivilegeViewSet, base_name='meeting-privileges')


"""
Element Labels (generic endpoint)
"""
router.register(r'element_labels', ElementLabelViewSet, base_name='element_labels')


urlpatterns = [
    # REST Endpoints for contacts (history, relations)
    url(r'^', include(contacts_router.urls)),

    # REST Endpoints for tasks (history, relations)
    url(r'^', include(tasks_router.urls)),

    # REST Endpoints for files (history, relations)
    url(r'^', include(files_router.urls)),

    # REST Endpoints for notes (history, relations)
    url(r'^', include(notes_router.urls)),

    # REST Endpoints for meetings  (history, relations)
    url(r'^', include(meetings_router.urls)),
]
