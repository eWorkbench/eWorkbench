#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

from rest_framework.test import APITestCase
from rest_framework import status

from eric.projects.models import Role, RolePermissionAssignment, Permission, Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, TestLockMixin
from eric.shared_elements.tests.core import ContactMixin

from eric.shared_elements.models import Contact

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class ChangeRelatedProjectTest(APITestCase, AuthenticationMixin, ProjectsMixin, ContactMixin, TestLockMixin):
    """ Testing the change of related projects in models such as Task, Meeting, Note, File, Contact """

    # set up users
    def setUp(self):
        # get user group
        self.user_group = Group.objects.get(name='User')

        # create two users and assign them to the user group
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret'
        )
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar'
        )
        self.user2.groups.add(self.user_group)

        # login
        self.token1 = self.login_and_return_token('student_1', 'top_secret', HTTP_USER_AGENT, REMOTE_ADDR)
        self.token2 = self.login_and_return_token('student_2', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)

        self.set_client_credentials(self.token1)

        # get project manager role
        self.projectManagerRole = Role.objects.filter(default_role_on_project_create=True).first()

        # create a role which can edit a contact but can not edit the related project of the contact
        self.test_role = self.create_role_without_change_related_project_permission()

        # create 2 new projects with user 1
        # user 1 is then the project manager of both projects
        self.project1 = self.create_project(self.token1, "New Project 1",
                                            "Unittest update related project1", Project.INITIALIZED,
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.project2 = self.create_project(self.token1, "New Project 2",
                                            "Unittest update related project2", Project.INITIALIZED,
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        # create a third project where user1 does not have access to
        self.project3 = self.create_project(self.token2, "New Project 3",
                                            "Unittest update related project3", Project.INITIALIZED,
                                            HTTP_USER_AGENT, REMOTE_ADDR)

        # assign user2 to both projects with the role that he can not change related projects
        self.rest_assign_user_to_project(self.token1, self.project1, self.user2, self.test_role,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.rest_assign_user_to_project(self.token1, self.project2, self.user2, self.test_role,
                                         HTTP_USER_AGENT, REMOTE_ADDR)

        response = self.rest_create_contact(
            self.token1, self.project1.pk, "Dr.", "First", "NumberOne", "first@eric.net", HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        decoded = json.loads(response.content.decode())
        # store this contact, we need it later
        self.contact1 = Contact.objects.filter(pk=decoded['pk']).first()

        # unlock contact with user1
        response = self.unlock(self.token1, "contacts", self.contact1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_change_related_project_not_allowed(self):
        """
        User tries to change contact1 to a project where the current user does not have access to
        :return:
        """
        self.set_client_credentials(self.token1)

        # change from project1 to project2 (should work, as user1 has full access to project1 and project2)
        response = self.rest_update_contact(self.token1, self.contact1.pk, self.project2.pk, "", "user2", "test",
                                            self.user1.email, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # change back to project1 (should work)
        response = self.rest_update_contact(self.token1, self.contact1.pk, self.project2.pk, "", "user2", "test",
                                            self.user1.email, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now change to project3 (should not work, as user1 does not have access to that project)
        response = self.rest_update_contact(self.token1, self.contact1.pk, self.project3.pk, "", "user2", "test",
                                            self.user1.email, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('projects' in decoded)

        # user2 should also not be able to switch it from project2 to project3, as user2 does not have the change permission
        response = self.rest_update_contact(self.token2, self.contact1.pk, self.project3.pk, "", "user2", "test",
                                            self.user1.email, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

    def test_change_related_project(self):
        """
            wants to update the contact with a new related project --> won't work
            then the role gets the permission for updating related projects
            updates the contact with a new related project again --> will work
        """
        # edit the firstname of the contact with user2 (allowed)
        # login with user2
        self.set_client_credentials(self.token2)

        # update contact
        response = self.rest_update_contact(self.token2, self.contact1.pk, self.project1.pk, "", "user2", "test",
                                            self.user1.email, HTTP_USER_AGENT, REMOTE_ADDR)

        # check if the update was correct
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(decoded_response['first_name'], "user2")

        # unlock contact with user2
        response = self.unlock(self.token2, "contacts", self.contact1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # edit the related project of the contact to project2 with user1 (allowed)
        # update related project from contact
        response = self.rest_update_contact(self.token1, self.contact1.pk, self.project2.pk, "", "user2", "test",
                                            self.user1.email, HTTP_USER_AGENT, REMOTE_ADDR)

        # check if the update worked
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(decoded_response['projects'][0], str(self.project2.pk))

        # unlock contact1 with user1
        response = self.unlock(self.token1, "contacts", self.contact1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # update the contact (but not the project) with user2 (should be allowed)
        response = self.rest_update_contact(self.token2, self.contact1.pk, self.project2.pk, "", "user name 2", "2 test",
                                            self.user1.email, HTTP_USER_AGENT, REMOTE_ADDR)

        # check the answer
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now also try to update the contacts project pk with user2 (should not be allowed)
        response = self.rest_update_contact(self.token2, self.contact1.pk, self.project1.pk, "", "user name 2", "2 test",
                                            self.user1.email, HTTP_USER_AGENT, REMOTE_ADDR)

        # check the answer
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response), 1, msg=_("You are not allowed to change the project"))

        # add the permission 'change related projects' to the test_role
        role = Role.objects.get(name='CannotChangeRelatedProject')
        change_related_project_permission = Permission.objects.filter(
            codename='change_project_contact',
            content_type=Contact.get_content_type()
        ).first()
        RolePermissionAssignment.objects.create(
            role=role,
            permission=change_related_project_permission
        )

        # edit the related project of the contact from project1 to project2 with user2 (allowed)
        # update related project from contact
        response = self.rest_update_contact(self.token2, self.contact1.pk, self.project2.pk, "", "user2", "test",
                                            self.user1.email, HTTP_USER_AGENT, REMOTE_ADDR)

        # check if the update worked
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(decoded_response['projects'][0], str(self.project2.pk))
