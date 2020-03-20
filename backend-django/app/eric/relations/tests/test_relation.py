#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.utils import timezone
from django.db import transaction
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import Group, Permission
from django.contrib.auth import get_user_model
from django.utils.translation import ugettext_lazy as _

from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin
from eric.shared_elements.tests.core import TaskMixin, NoteMixin, ContactMixin, MeetingMixin
from eric.relations.tests.core import RelationsMixin
from eric.relations.models import Relation
from eric.projects.models import Project
from eric.shared_elements.models import Task, Note, Meeting, Contact, File
from eric.projects.models import Role

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class RelationsTest(APITestCase, AuthenticationMixin, ProjectsMixin, RelationsMixin,
                    TaskMixin, NoteMixin, ContactMixin, MeetingMixin):
    """ Extensive testing of relation endpoint """

    def setUp(self):
        """ set up 2 users, a project, 2 tasks, a note, a meeting, a contact"""

        # get user group
        self.user_group = Group.objects.get(name='User')

        # create 2 users and assign them to the user group
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        self.user3 = User.objects.create_user(
            username='student_3', email='student_3@email.com', password='qwerty')
        self.user3.groups.add(self.user_group)

        self.superuser = User.objects.create_user(
            username='superuser', email='super@user.com', password='sudo', is_superuser=True
        )

        self.token1 = self.login_and_return_token('student_1', 'top_secret', HTTP_USER_AGENT, REMOTE_ADDR)
        self.token2 = self.login_and_return_token('student_2', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)
        self.token3 = self.login_and_return_token('student_3', 'qwerty', HTTP_USER_AGENT, REMOTE_ADDR)
        self.superuser_token = self.login_and_return_token('superuser', 'sudo', HTTP_USER_AGENT, REMOTE_ADDR)

        # create two new projects
        self.project1 = self.create_project(
            self.token1,
            "DMP Project",
            "Unittest DMP Project",
            "INIT",
            HTTP_USER_AGENT,
            REMOTE_ADDR
        )

        self.project2 = self.create_project(
            self.token1,
            "DMP Project",
            "Unittest DMP Project",
            "INIT",
            HTTP_USER_AGENT,
            REMOTE_ADDR
        )

        # create a new task via API
        self.task1, response = self.create_task_orm(self.token1, self.project1.pk,
                                                    "The new Task", "Task Description",
                                                    Task.TASK_STATE_NEW, Task.TASK_PRIORITY_VERY_HIGH,
                                                    timezone.now(), timezone.now(), self.user1.pk, HTTP_USER_AGENT,
                                                    REMOTE_ADDR)

        # create another task
        self.task2, response = self.create_task_orm(self.token1, self.project1.pk,
                                                    "Another new Task", "Task Description",
                                                    Task.TASK_STATE_NEW, Task.TASK_PRIORITY_VERY_HIGH,
                                                    timezone.now(), timezone.now(), self.user1.pk, HTTP_USER_AGENT,
                                                    REMOTE_ADDR)

        # create another task without a project
        self.task3, response = self.create_task_orm(self.token1, None,
                                                    "Another new Task without project", "Task Description",
                                                    Task.TASK_STATE_NEW, Task.TASK_PRIORITY_VERY_HIGH,
                                                    timezone.now(), timezone.now(), self.user1.pk, HTTP_USER_AGENT,
                                                    REMOTE_ADDR)

        # create a new note via API
        self.note1, response = self.create_note_orm(self.token1, self.project1.pk,
                                                    "Note1 Title", "Some Note Description",
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        # create another note in a project
        self.note2, response = self.create_note_orm(self.token1, self.project1.pk,
                                                    "Note2 Title", "Another Note Description",
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        # create another note in a project
        self.note3, response = self.create_note_orm(self.token1, self.project1.pk,
                                                    "Note3 Title", "Another Note Description",
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        # create a note without a project
        self.note4, response = self.create_note_orm(self.token1, None,
                                                    "Note4 Title without project", "Another Note Description",
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        # create another note without a project
        self.note5, response = self.create_note_orm(self.token1, None,
                                                    "Note5 Title without project", "Another Note Description",
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        # create a meeting via API
        self.meeting1, response = self.create_meeting_orm(self.token1, self.project1.pk,
                                                          "The new meeting", "a meeting description",
                                                          timezone.now(), timezone.now(),
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        # create another meeting
        self.meeting2, response = self.create_meeting_orm(self.token1, self.project1.pk,
                                                          "Another new meeting", "a meeting description",
                                                          timezone.now(), timezone.now(),
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        # create another meeting without a project
        self.meeting3, response = self.create_meeting_orm(self.token1, None,
                                                          "Another new meeting without a project",
                                                          "a meeting description",
                                                          timezone.now(), timezone.now(),
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        # create a new contact
        self.contact1, response = self.create_contact_orm(self.token1, self.project1.pk,
                                                          "Dr.", "Max", "Mustermann", "max@mustermann.at",
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        # another new contact
        self.contact2, response = self.create_contact_orm(self.token1, self.project1.pk,
                                                          "DI", "Max", "Musterfrau", "max@musterfrau.at",
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        # another new contact without a project
        self.contact3, response = self.create_contact_orm(self.token1, None,
                                                          "Dr.", "Maxine", "Musterfrau", "maxine@musterfrau.at",
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        # get project manager role
        self.projectManagerRole = Role.objects.filter(default_role_on_project_create=True).first()
        self.observerRole = Role.objects.filter(name="Observer").first()

        # add user2 to project1 as observer
        self.rest_assign_user_to_project(self.token1, self.project1, self.user2, self.observerRole, HTTP_USER_AGENT,
                                         REMOTE_ADDR)

    def test_create_self_linked_relation(self):
        """ Tries to create a relation with itself (the same object) which is not allowed """
        response = self.rest_create_relation(self.token1, "tasks", self.task1.pk,
                                             Task.get_content_type(), self.task1.pk,
                                             Task.get_content_type(), self.task1.pk, False,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        # should fail
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        decoded = json.loads(response.content.decode())
        print(decoded)
        self.assertTrue('left_content_object' in decoded)
        self.assertEquals(",".join(decoded['left_content_object']),
                          _('is not allowed to be the same object as the right_content_object'))

    def test_create_relation(self):
        """ Tries to create relations and verifies that the relation was created """
        # create a new relation between task1 and note1
        relation = self.create_task_relation(self.token1, self.task1.pk,
                                             Task.get_content_type(), self.task1.pk,
                                             Note.get_content_type(), self.note1.pk, False, HTTP_USER_AGENT,
                                             REMOTE_ADDR)

        # get all relations for this note
        response = self.rest_get_note_relations(self.token1, self.note1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # decode the relations for this note
        decoded_response = json.loads(response.content.decode())
        # should be exactly one
        self.assertEquals(len(decoded_response), 1, msg="Should be exactly one relation for this note")
        self.assertEquals(decoded_response[0]['pk'], str(relation.pk))

        # also there should be exactly one relation in tasks
        response = self.rest_get_task_relations(self.token1, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # decode the relations for this task
        decoded_response = json.loads(response.content.decode())
        # should be five relations
        self.assertEquals(len(decoded_response), 1, msg="Should be exactly one relation for this task")
        self.assertEquals(decoded_response[0]['pk'], str(relation.pk))

        # create a new relation between task1 and meeting1
        relation = self.create_task_relation(self.token1, self.task1.pk,
                                             Task.get_content_type(), self.task1.pk,
                                             Meeting.get_content_type(), self.meeting1.pk, True, HTTP_USER_AGENT,
                                             REMOTE_ADDR)

        # get all relations for this meeting
        response = self.rest_get_meeting_relations(self.token1, self.meeting1.pk, HTTP_USER_AGENT,
                                                   REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # decode the relations for this note
        decoded_response = json.loads(response.content.decode())
        # should be exactly one
        self.assertEquals(len(decoded_response), 1, msg="Should be exactly one relation")
        self.assertEquals(decoded_response[0]['pk'], str(relation.pk))

        # get all relations for task1
        response = self.rest_get_task_relations(self.token1, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # decode the relations for this task
        decoded_response = json.loads(response.content.decode())
        # should be five relations
        self.assertEquals(len(decoded_response), 2, msg="Should be exactly two relations for this task")
        self.assertEquals(Relation.objects.all().count(), 2, msg="There should be exactly two relations")

        # create a new relation between task and contact
        relation = self.create_task_relation(self.token1, self.task1.pk,
                                             Task.get_content_type(), self.task1.pk,
                                             Contact.get_content_type(), self.contact1.pk, True,
                                             HTTP_USER_AGENT, REMOTE_ADDR)

        # get all relations for this contact
        response = self.rest_get_contact_relations(self.token1, self.contact1.pk, HTTP_USER_AGENT,
                                                   REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # decode the relations for this note
        decoded_response = json.loads(response.content.decode())
        # should be exactly one
        self.assertEquals(len(decoded_response), 1, msg="Should be exactly one relation for contact")
        self.assertEquals(decoded_response[0]['pk'], str(relation.pk))

        # get all relations for task1
        response = self.rest_get_task_relations(self.token1, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # decode the relations for this task
        decoded_response = json.loads(response.content.decode())
        # should be three relations
        self.assertEquals(len(decoded_response), 3, msg="Should be exactly three relations for this task")
        self.assertEquals(Relation.objects.all().count(), 3, msg="There should be exactly three relations")

        # special case: create a new relation between task and another task
        relation = self.create_task_relation(self.token1, self.task1.pk,
                                             Task.get_content_type(), self.task1.pk,
                                             Task.get_content_type(), self.task2.pk,
                                             False, HTTP_USER_AGENT, REMOTE_ADDR)

        # get relations for task2
        response = self.rest_get_task_relations(self.token1, self.task2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        print(len(decoded_response))

        # get all relations for this task
        response = self.rest_get_task_relations(self.token1, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # decode the relations for this note
        decoded_response = json.loads(response.content.decode())
        # should be five relations
        self.assertEquals(len(decoded_response), 4, msg="Should be exactly four relations for tasks")

        self.assertEquals(Relation.objects.all().count(), 4, msg="There should be exactly four relations")

    def test_create_relation_with_wrong_parameter(self):
        """ Tries to create a relation with wrong parameters """
        self.assertEquals(Relation.objects.all().count(), 0, msg="There should be zero relations to start with")

        # do not send the private field (allowed, as it is set to False per default)
        response = self.client.post(
            '/api/tasks/{task_id}/relations/'.format(task_id=self.task1.pk),
            {
                'left_content_type': Meeting.get_content_type().id,
                'left_object_id': self.meeting1.pk,
                'right_content_type': Note.get_content_type().id,
                'right_object_id': self.note1.pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['private'], False)

        # send an empty private field (allowed, default=False)
        response = self.client.post(
            '/api/tasks/{task_id}/relations/'.format(task_id=self.task1.pk),
            {
                'left_content_type': Meeting.get_content_type().id,
                'left_object_id': self.meeting1.pk,
                'right_content_type': Note.get_content_type().id,
                'right_object_id': self.note1.pk,
                'private': ''
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['private'], False)

        self.assertEquals(Relation.objects.all().count(), 2, msg="There should be two relations")

        # do not send the left_content_type
        response = self.client.post(
            '/api/tasks/{task_id}/relations/'.format(task_id=self.task1.pk),
            {
                'left_object_id': self.meeting1.pk,
                'right_content_type': Note.get_content_type().id,
                'right_object_id': self.note1.pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEquals(response.content.decode(), '{"left_content_type":["This field is required."]}')

        # send an empty left_content_type
        response = self.client.post(
            '/api/tasks/{task_id}/relations/'.format(task_id=self.task1.pk),
            {
                'left_content_type': '',
                'left_object_id': self.meeting1.pk,
                'right_content_type': Note.get_content_type().id,
                'right_object_id': self.note1.pk,
                'private': ''
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEquals(response.content.decode(), '{"left_content_type":["This field may not be null."]}')

        # do not send the left_object_id
        response = self.client.post(
            '/api/tasks/{task_id}/relations/'.format(task_id=self.task1.pk),
            {
                'left_content_type': Task.get_content_type().id,
                'right_content_type': Note.get_content_type().id,
                'right_object_id': self.note1.pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEquals(response.content.decode(), '{"left_object_id":["This field is required."]}')

        # left_content_type and left_object_id do not fit
        response = self.client.post(
            '/api/tasks/{task_id}/relations/'.format(task_id=self.task1.pk),
            {
                'left_content_type': Task.get_content_type().id,
                'left_object_id': self.note1.pk,
                'right_content_type': Note.get_content_type().id,
                'right_object_id': self.note1.pk,
                'private': ''
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEquals(response.content.decode(), '{"left_content_object":["can not be none"]}')

        self.assertEquals(Relation.objects.all().count(), 2, msg="There should be two relations")

    def test_relation_update_with_wrong_parameter(self):
        """ tries to update the relation with wrong parameter"""
        # create a new relation
        relation = self.create_task_relation(self.token1, self.task1.pk, Task.get_content_type(),
                                             self.task1.pk,
                                             Note.get_content_type(), self.note1.pk, False, HTTP_USER_AGENT,
                                             REMOTE_ADDR)

        # do not send left_content_type
        response = self.client.put(
            '/api/tasks/{task_id}/relations/{relation_id}/'.format(task_id=self.task1.pk, relation_id=relation.pk),
            {
                'left_object_id': self.task1.pk,
                'right_content_type': Note.get_content_type().id,
                'right_object_id': self.note1.pk,
                'private': False
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEquals(response.content.decode(), '{"left_content_type":["This field is required."]}')

        # send wrong left_content_type (allowed, put left_content_type is not changed)
        response = self.client.put(
            '/api/tasks/{task_id}/relations/{relation_id}/'.format(task_id=self.task1.pk, relation_id=relation.pk),
            {
                'left_content_type': Note.get_content_type().id,
                'left_object_id': self.task1.pk,
                'right_content_type': Note.get_content_type().id,
                'right_object_id': self.note1.pk,
                'private': False
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertNotEqual(decoded_response['left_content_type'], int(Note.get_content_type().id))
        self.assertEquals(decoded_response['left_content_type'], int(Task.get_content_type().id))

    def test_relation_update_private_field(self):
        """ tries to update the private field of the relation """
        # create a new relation
        relation = self.create_task_relation(self.token1, self.task1.pk, Task.get_content_type(), self.task1.pk,
                                             Note.get_content_type(), self.note1.pk, False, HTTP_USER_AGENT,
                                             REMOTE_ADDR)

        # update the private field to true with student 1 (allowed)
        response = self.rest_update_task_relation(self.token1, self.task1.pk, relation.pk, Task.get_content_type(),
                                                  self.task1.pk, Note.get_content_type(), self.note1.pk, True,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # decode response and load it into json
        decoded_response = json.loads(response.content.decode())
        self.assertEquals(decoded_response['private'], True)

        # get call with student 2 to receive the private relation (not allowed)
        response = self.rest_get_task_relation(self.token2, self.task1.pk, relation.pk, HTTP_USER_AGENT,
                                               REMOTE_ADDR)

        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # update the private field to false with student 1 (allowed)
        response = self.rest_update_task_relation(self.token1, self.task1.pk, relation.pk,
                                                  Task.get_content_type(),
                                                  self.task1.pk, Note.get_content_type(), self.note1.pk, False,
                                                  HTTP_USER_AGENT,
                                                  REMOTE_ADDR)

        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # get the relation with student 2 (allowed)
        response = self.rest_get_task_relation(self.token2, self.task1.pk, relation.pk, HTTP_USER_AGENT,
                                               REMOTE_ADDR)

        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # decode response and load it into json
        decoded_response = json.loads(response.content.decode())
        self.assertEquals(decoded_response['pk'], str(relation.pk))

        # update the relation with student 2 (not allowed)
        response = self.rest_update_task_relation(self.token2, self.task1.pk, relation.pk,
                                                  Task.get_content_type(),
                                                  self.task1.pk, Note.get_content_type(), self.note1.pk, False,
                                                  HTTP_USER_AGENT,
                                                  REMOTE_ADDR)

        self.assertContains(response, _("You are not allowed to change"), status_code=status.HTTP_400_BAD_REQUEST)

    def test_delete_relation(self):
        """ tries to delete a relation """
        # create a new relation with student 1
        relation = self.create_task_relation(self.token1, self.task1.pk, Task.get_content_type(),
                                             self.task1.pk,
                                             Note.get_content_type(), self.note1.pk, False, HTTP_USER_AGENT,
                                             REMOTE_ADDR)

        # delete relation with student 1 (allowed)
        response = self.rest_delete_task_relation(self.token1, self.task1.pk, relation.pk, HTTP_USER_AGENT,
                                                  REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)

        # try to get the just deleted relation with student 1 (does not work obviously)
        response = self.rest_get_task_relation(self.token1, self.task1.pk, relation.pk, HTTP_USER_AGENT,
                                               REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # create a new relation with student 1
        relation = self.create_task_relation(self.token1, self.task1.pk, Task.get_content_type(),
                                             self.task1.pk,
                                             Note.get_content_type(), self.note1.pk, False, HTTP_USER_AGENT,
                                             REMOTE_ADDR)

        # try to get relation with student 2 (works)
        response = self.rest_get_task_relation(self.token2, self.task1.pk, relation.pk, HTTP_USER_AGENT,
                                               REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # delete relation with student 2 (not allowed)
        response = self.rest_delete_task_relation(self.token2, self.task1.pk, relation.pk, HTTP_USER_AGENT,
                                                  REMOTE_ADDR)
        self.assertContains(
            response, _("You do not have permission to perform this action"),
            status_code=status.HTTP_403_FORBIDDEN
        )

        # verify the relation still exists
        response = self.rest_get_task_relation(self.token2, self.task1.pk, relation.pk, HTTP_USER_AGENT,
                                               REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_relate_task_to_everything(self):
        """
        Tries to relate a Task with all other types (Project, Task, Meeting, Contact, File, Note)
        :return:
        """
        # relate task with project
        relation1 = self.create_task_relation(
            self.token1, self.task1.pk,
            Task.get_content_type(), self.task1.pk,
            Project.get_content_type(), self.project1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate task with task
        relation2 = self.create_task_relation(
            self.token1, self.task1.pk,
            Task.get_content_type(), self.task1.pk,
            Task.get_content_type(), self.task2.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate task with meeting
        relation3 = self.create_task_relation(
            self.token1, self.task1.pk,
            Task.get_content_type(), self.task1.pk,
            Meeting.get_content_type(), self.meeting1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate task with contact
        relation4 = self.create_task_relation(
            self.token1, self.task1.pk,
            Task.get_content_type(), self.task1.pk,
            Contact.get_content_type(), self.contact1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate task with note
        relation5 = self.create_task_relation(
            self.token1, self.task1.pk,
            Task.get_content_type(), self.task1.pk,
            Note.get_content_type(), self.note1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # there should now be 5 relations available in tasks
        response = self.rest_get_task_relations(self.token1, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, 200)
        decoded_content = json.loads(response.content.decode())
        self.assertEquals(len(decoded_content), 5, msg="There should be 5 relations for this task")
        self.assertEquals(Relation.objects.all().count(), 5, msg="There should be 5 relations")

    def test_relate_meeting_to_everything(self):
        """
        Tries to relate a Meeting with all other types (Project, Task, Meeting, Contact, File, Note)
        :return:
        """
        # relate meeting with project
        relation1 = self.create_meeting_relation(
            self.token1, self.meeting1.pk,
            Meeting.get_content_type(), self.meeting1.pk,
            Project.get_content_type(), self.project1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate meeting with task
        relation2 = self.create_meeting_relation(
            self.token1, self.meeting1.pk,
            Meeting.get_content_type(), self.meeting1.pk,
            Task.get_content_type(), self.task1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate meeting with meeting
        relation3 = self.create_meeting_relation(
            self.token1, self.meeting1.pk,
            Meeting.get_content_type(), self.meeting1.pk,
            Meeting.get_content_type(), self.meeting2.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate meeting with contact
        relation4 = self.create_meeting_relation(
            self.token1, self.meeting1.pk,
            Meeting.get_content_type(), self.meeting1.pk,
            Contact.get_content_type(), self.contact1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate meeting with note
        relation5 = self.create_meeting_relation(
            self.token1, self.meeting1.pk,
            Meeting.get_content_type(), self.meeting1.pk,
            Note.get_content_type(), self.note1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # there should now be 5 relations available in meetings
        response = self.rest_get_meeting_relations(self.token1, self.meeting1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, 200)
        decoded_content = json.loads(response.content.decode())
        self.assertEquals(len(decoded_content), 5, msg="There should be 5 relations for this meeting")
        self.assertEquals(Relation.objects.all().count(), 5, msg="There should be 5 relations")

    def test_relate_contact_to_everything(self):
        """
        Tries to relate a Contact with all other types (Project, Task, Meeting, Contact, File, Note)
        :return:
        """
        # relate contact with project
        relation1 = self.create_contact_relation(
            self.token1, self.contact1.pk,
            Contact.get_content_type(), self.contact1.pk,
            Project.get_content_type(), self.project1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate contact with task
        relation2 = self.create_contact_relation(
            self.token1, self.contact1.pk,
            Contact.get_content_type(), self.contact1.pk,
            Task.get_content_type(), self.task1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate contact with meeting
        relation3 = self.create_contact_relation(
            self.token1, self.contact1.pk,
            Contact.get_content_type(), self.contact1.pk,
            Meeting.get_content_type(), self.meeting2.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate contact with contact
        relation4 = self.create_contact_relation(
            self.token1, self.contact1.pk,
            Contact.get_content_type(), self.contact1.pk,
            Contact.get_content_type(), self.contact2.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate contact with note
        relation5 = self.create_contact_relation(
            self.token1, self.contact1.pk,
            Contact.get_content_type(), self.contact1.pk,
            Note.get_content_type(), self.note1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # there should now be 5 relations available in meetings
        response = self.rest_get_contact_relations(self.token1, self.contact1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, 200)
        decoded_content = json.loads(response.content.decode())
        self.assertEquals(len(decoded_content), 5, msg="There should be 5 relations for this contact")
        self.assertEquals(Relation.objects.all().count(), 5, msg="There should be 5 relations")

    def test_relate_note_to_everything(self):
        """
        Tries to relate a Note with all other types (Project, Task, Meeting, Contact, File, Note)
        :return:
        """
        # relate note with project
        relation1 = self.create_note_relation(
            self.token1, self.note1.pk,
            Note.get_content_type(), self.note1.pk,
            Project.get_content_type(), self.project1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate note with task
        relation2 = self.create_note_relation(
            self.token1, self.note1.pk,
            Note.get_content_type(), self.note1.pk,
            Task.get_content_type(), self.task1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate note with meeting
        relation3 = self.create_note_relation(
            self.token1, self.note1.pk,
            Note.get_content_type(), self.note1.pk,
            Meeting.get_content_type(), self.meeting2.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate note with contact
        relation4 = self.create_note_relation(
            self.token1, self.note1.pk,
            Note.get_content_type(), self.note1.pk,
            Contact.get_content_type(), self.contact2.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate note with note
        relation5 = self.create_note_relation(
            self.token1, self.note1.pk,
            Note.get_content_type(), self.note1.pk,
            Note.get_content_type(), self.note2.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # there should now be 5 relations available in meetings
        response = self.rest_get_note_relations(self.token1, self.note1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, 200)
        decoded_content = json.loads(response.content.decode())
        self.assertEquals(len(decoded_content), 5, msg="There should be 5 relations for this note")
        self.assertEquals(Relation.objects.all().count(), 5, msg="There should be 5 relations")

    def test_relations_can_not_be_created_if_not_viewable_by_user(self):
        """
        Tries to relate items that are not viewable by the current user (which should fail)
        :return:
        """

        # verify that user2 has no access to note4
        response = self.rest_get_note(self.token2, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that user2 can not relate anything to note4 (should not have access to note4 -> 404)
        response = self.rest_create_relation(self.token2, "notes", self.note4.pk,
                                             Note.get_content_type(), self.note4.pk,
                                             Project.get_content_type(), self.project1.pk, False,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.rest_create_relation(self.token2, "notes", self.note4.pk,
                                             Note.get_content_type(), self.note4.pk,
                                             Task.get_content_type(), self.task1.pk, False,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.rest_create_relation(self.token2, "notes", self.note4.pk,
                                             Note.get_content_type(), self.note4.pk,
                                             Note.get_content_type(), self.note1.pk, False,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.rest_create_relation(self.token2, "notes", self.note4.pk,
                                             Note.get_content_type(), self.note4.pk,
                                             Meeting.get_content_type(), self.meeting1.pk, False,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.rest_create_relation(self.token2, "tasks", self.task1.pk,
                                             Task.get_content_type(), self.task1.pk,
                                             Note.get_content_type(), self.note4.pk, False,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertContains(response, _("You do not have permission to relate"),
                            status_code=status.HTTP_400_BAD_REQUEST)

        response = self.rest_create_relation(self.token2, "notes", self.note1.pk,
                                             Note.get_content_type(), self.note1.pk,
                                             Note.get_content_type(), self.note4.pk, False,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertContains(response, _("You do not have permission to relate"),
                            status_code=status.HTTP_400_BAD_REQUEST)

        # finally, there should have been zero relations created
        self.assertEquals(Relation.objects.all().count(), 0, msg="There should be zero relations")

    def test_relate_note_to_everything_view_permissions(self):
        """
        Tries to relate a note (note4) without a project to all other elements, which should make the note visible
        :return:
        """
        # verify that user1 has access to note4 (user1 is the owner)
        response = self.rest_get_note(self.token1, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that user2 has no access to note4
        response = self.rest_get_note(self.token2, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # relate note4 with project1 through user1
        relation1 = self.create_note_relation(
            self.token1, self.note4.pk,
            Note.get_content_type(), self.note4.pk,
            Project.get_content_type(), self.project1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate note4 with task1 through user1
        relation2 = self.create_note_relation(
            self.token1, self.note4.pk,
            Note.get_content_type(), self.note4.pk,
            Task.get_content_type(), self.task1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # try to get relations of task1 with user2 (via project1)
        response = self.rest_get_task_relations(self.token2, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # verify response to contain the note
        self.assertEquals(len(decoded_response), 1, msg="There should be exactly one relation with the task")
        self.assertEquals(
            decoded_response[0]['left_object_id'], str(self.note4.pk),
            msg="Left object id of relation should be note4.pk"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['subject'], self.note4.subject,
            msg="Left content object should have the notes subject"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['content'], self.note4.content,
            msg="Left content object should have the notes content"
        )

        # relate note4 with meeting1 through user1
        relation3 = self.create_note_relation(
            self.token1, self.note4.pk,
            Note.get_content_type(), self.note4.pk,
            Meeting.get_content_type(), self.meeting1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # try to get relations of meeting1 with user2
        response = self.rest_get_meeting_relations(self.token2, self.meeting1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # verify response to contain the note
        self.assertEquals(len(decoded_response), 1, msg="There should be exactly one relation with the meeting")
        self.assertEquals(
            decoded_response[0]['left_object_id'], str(self.note4.pk),
            msg="Left object id of relation should be note4.pk"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['subject'], self.note4.subject,
            msg="Left content object should have the notes subject"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['content'], self.note4.content,
            msg="Left content object should have the notes content"
        )

        # relate note4 with contact1 through user1
        relation4 = self.create_note_relation(
            self.token1, self.note4.pk,
            Note.get_content_type(), self.note4.pk,
            Contact.get_content_type(), self.contact1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # try to get relations of contact1 with user2
        response = self.rest_get_contact_relations(self.token2, self.contact1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # verify response to contain the note (but not the relations marked as private)
        self.assertEquals(len(decoded_response), 1, msg="There should be exactly one relation with the contact")
        self.assertEquals(
            decoded_response[0]['left_object_id'], str(self.note4.pk),
            msg="Left object id of relation should be note4.pk"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['subject'], self.note4.subject,
            msg="Left content object should have the notes subject"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['content'], self.note4.content,
            msg="Left content object should have the notes content"
        )

        # relate note1 with note4 with user1
        relation5 = self.create_note_relation(
            self.token1, self.note4.pk,
            Note.get_content_type(), self.note4.pk,
            Note.get_content_type(), self.note1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # try to get relations of note1 with user2
        response = self.rest_get_note_relations(self.token2, self.note1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # verify response to contain the note
        self.assertEquals(len(decoded_response), 1, msg="There should be exactly one relation with the note")
        self.assertEquals(
            decoded_response[0]['left_object_id'], str(self.note4.pk),
            msg="Left object id of relation should be note4.pk"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['subject'], self.note4.subject,
            msg="Left content object should have the notes subject"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['content'], self.note4.content,
            msg="Left content object should have the notes content"
        )

        # user2 should be able to view note4 directly (through inherited relations via project1)
        response = self.rest_get_note(self.token2, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # it should also be possible to get all relations of note4 with user2 (through inherited relations via project1)
        response = self.rest_get_note_relations(self.token2, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_relate_note_view_permission_through_inheritance(self):
        """
        Tries to relate a note (note4) without a project to elements in a project, which should make the note visible
        to other project members with view-permissions
        :return:
        """
        # verify that user1 has access to note4 (user1 is the owner)
        response = self.rest_get_note(self.token1, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that user2 has no access to note4
        response = self.rest_get_note(self.token2, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that user3 has no access to note4
        response = self.rest_get_note(self.token3, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # relate note4 with task1 through user1
        relation2 = self.create_note_relation(
            self.token1, self.note4.pk,
            Note.get_content_type(), self.note4.pk,
            Task.get_content_type(), self.task1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # try to get relations of task1 with user2 (via project1)
        response = self.rest_get_task_relations(self.token2, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # verify response to contain the note
        self.assertEquals(len(decoded_response), 1, msg="There should be exactly one relation with the task")
        self.assertEquals(
            decoded_response[0]['left_object_id'], str(self.note4.pk),
            msg="Left object id of relation should be note4.pk"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['subject'], self.note4.subject,
            msg="Left content object should have the notes subject"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['content'], self.note4.content,
            msg="Left content object should have the notes content"
        )

        # verify that user2 now has access to note4 (through project1)
        response = self.rest_get_note(self.token2, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that user3 still has no access to note4
        response = self.rest_get_note(self.token3, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_relate_privately_view_permission(self):
        """
        Tries to privately relate a note (note4) without a project to elements in a project,
        which should keep the note invisible (private) to other project members with view-permissions
        Further, a note (note5) is privately related to a task without a project, which should also
        keep the note invisible (private) to other project members
        :return:
        """
        # verify that user1 has access to note4 (user1 is the owner)
        response = self.rest_get_note(self.token1, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that user2 has no access to note4
        response = self.rest_get_note(self.token2, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that user3 has no access to note4
        response = self.rest_get_note(self.token3, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that user1 has access to note5 (user1 is the owner)
        response = self.rest_get_note(self.token1, self.note5.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that user2 has no access to note5
        response = self.rest_get_note(self.token2, self.note5.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that user3 has no access to note5
        response = self.rest_get_note(self.token3, self.note5.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # privately relate note4 with task1 through user1
        relation1 = self.create_note_relation(
            self.token1, self.note4.pk,
            Note.get_content_type(), self.note4.pk,
            Task.get_content_type(), self.task1.pk, True,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # relate note5 with task1 through user1
        relation2 = self.create_note_relation(
            self.token1, self.note5.pk,
            Note.get_content_type(), self.note5.pk,
            Task.get_content_type(), self.task1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # verify that user2 still has no access to note4
        response = self.rest_get_note(self.token2, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that user3 still has no access to note4
        response = self.rest_get_note(self.token3, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # try to get relations of task1 with user2 (via project1)
        response = self.rest_get_task_relations(self.token2, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # verify response to contain the note
        self.assertEquals(len(decoded_response), 1, msg="There should be exactly one relation with the task")
        self.assertEquals(
            decoded_response[0]['left_object_id'], str(self.note5.pk),
            msg="Left object id of relation should be note5.pk"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['subject'], self.note5.subject,
            msg="Left content object should have the notes subject"
        )
        self.assertEquals(
            decoded_response[0]['left_content_object']['content'], self.note5.content,
            msg="Left content object should have the notes content"
        )

        # verify that user2 has access to note5 (via project1)
        response = self.rest_get_note(self.token2, self.note5.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that user3 still has no access to note5
        response = self.rest_get_note(self.token3, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_related_object_should_also_delete_relation(self):
        """
        Tests that deleting an object with relations should also delete the relations
        This is especially true for relations that the current user does not have permissions
        :return:
        """
        # verify that user1 has access to note4
        response = self.rest_get_note(self.token1, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that user2 has no access to note4
        response = self.rest_get_note(self.token2, self.note4.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that user1 has access to task1
        response = self.rest_get_task(self.token1, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that user2 has access to task1
        response = self.rest_get_task(self.token2, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # we now have the following situation:
        # user1 has access to note4 and task1
        # user2 does not access to note4, only to task1
        # we now relate task1 with note4
        relation1 = self.create_note_relation(
            self.token1, self.note4.pk,
            Note.get_content_type(), self.note4.pk,
            Task.get_content_type(), self.task1.pk, False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # user2 creates a note (comment) on the task
        response = self.rest_create_note(self.token2, None, "My comment", "my comment", HTTP_USER_AGENT, REMOTE_ADDR)
        decoded_response = json.loads(response.content.decode())
        personal_note = Note.objects.get(pk=decoded_response['pk'])

        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        # relate it with user2 (private=True)
        relation2 = self.create_note_relation(
            self.token2, personal_note.pk,
            Note.get_content_type(), personal_note.pk,
            Task.get_content_type(), self.task1.pk, True,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # now user1 trashes task1
        response = self.rest_trash_task(self.token1, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # and deletes task1
        response = self.rest_delete_task(self.superuser_token, self.task1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)

        # this should lead to relation1 and relation2 also being deleted
        self.assertEquals(Relation.objects.filter(pk=relation1.pk).exists(), False)
        self.assertEquals(Relation.objects.filter(pk=relation2.pk).exists(), False)

        # however, the personal note still exists
        self.assertEquals(Note.objects.filter(pk=personal_note.pk).exists(), True)
