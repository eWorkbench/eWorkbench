#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import datetime
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from rest_framework import status
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_403_FORBIDDEN
from rest_framework.test import APITestCase

from eric.labbooks.models import LabBook, LabbookSection
from eric.labbooks.tests.core import LabBookMixin, LabbookSectionMixin
from eric.model_privileges.models import ModelPrivilege
from eric.projects.models import Permission, Project, Role
from eric.projects.tests.core import AuthenticationMixin, ModelPrivilegeMixin, ProjectsMixin
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin
from eric.shared_elements.models import File
from eric.shared_elements.tests.core import FileMixin

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class TestLabBookSections(
    APITestCase, LabBookMixin, LabbookSectionMixin, AuthenticationMixin, ProjectsMixin, FileMixin
):
    def setUp(self):
        self.observer_role = Role.objects.filter(name="Observer").first()
        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name="User")

        self.user1 = User.objects.create_user(username="student_1", email="student_1@email.com", password="top_secret")
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(username="student_2", email="student_2@email.com", password="foobar")
        self.user2.groups.add(self.user_group)

        self.token1 = self.login_and_return_token("student_1", "top_secret")
        self.token2 = self.login_and_return_token("student_2", "foobar")

        self.http_data = {
            "HTTP_USER_AGENT": HTTP_USER_AGENT,
            "REMOTE_ADDR": REMOTE_ADDR,
        }

        self.labbooksection_content_type_id = LabbookSection.get_content_type().id

        self.labbooksection_view_permission = Permission.objects.filter(
            codename="add_labbooksection", content_type=LabbookSection.get_content_type()
        ).first()

        # create two projects
        self.project1 = self.create_project(
            self.token1,
            "My Own Project (user1)",
            "Only user1 has access to this project",
            "START",
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        self.project2 = self.create_project(
            self.token2,
            "Another Project (user2)",
            "Only user2 has access to this project",
            "START",
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        # pre-requisite for this test: the user group must have the create labbooksection permission
        self.user_group.permissions.add(self.labbooksection_view_permission)

        self.http_data = {
            "HTTP_USER_AGENT": HTTP_USER_AGENT,
            "REMOTE_ADDR": REMOTE_ADDR,
        }

        self.dates = {"today": datetime.date.today()}

    def test_labbook_section_elements(self):
        """
        Extensive test that tries adding new elements to a labbook, viewing and editing those elements with a second user
        aswell as re-ordering the elements
        Also removes an element from the labbook
        :return:
        """
        # create a new labbook
        labbook, response = self.create_labbook_orm(self.token1, None, "LabBook 1", False, **self.http_data)

        # create a new labbooksection
        labbooksection, response = self.create_labbooksection_orm(
            self.token1, self.project1.pk, self.dates["today"], "Section 1", [], **self.http_data
        )

        # unlock labbooksection with user1
        response = self.unlock(self.token1, "labbooksections", labbooksection.pk, **self.http_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # add labbooksection to labbook
        response = self.rest_add_labbook_element(
            self.token1,
            labbook.pk,
            labbooksection.get_content_type().id,
            labbooksection.pk,
            0,
            0,
            20,
            1,
            **self.http_data,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # unlock labbooksection with user1 (adding it to a labbook causes the projects to be synced)
        response = self.unlock(self.token1, "labbooksections", labbooksection.pk, **self.http_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # verify that decoded response contains several things
        self.assertEqual(decoded_response["lab_book_id"], str(labbook.pk))
        self.assertEqual(decoded_response["position_x"], 0)
        self.assertEqual(decoded_response["position_y"], 0)
        self.assertEqual(decoded_response["width"], 20)
        self.assertEqual(decoded_response["height"], 1)
        self.assertEqual(decoded_response["child_object_content_type"], labbooksection.get_content_type().id)
        self.assertEqual(decoded_response["child_object_id"], str(labbooksection.pk))

        # verify that this labbook now has one child element
        self.assertEqual(LabBook.objects.filter(pk=labbook.pk).first().child_elements.all().count(), 1)

        # fetch child elements via REST API and verify that it contains one child element
        response = self.rest_get_labbook_elements(self.token1, labbook.pk, **self.http_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # decode it
        decoded_list = json.loads(response.content.decode())

        # verify it contains exactly one item
        self.assertEqual(len(decoded_list), 1)

        # and now try to view the labbooksection of the labbook as user2 (should not work)
        response = self.rest_get_labbooksection(self.token2, labbooksection.pk, **self.http_data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # create a new file
        response = self.rest_create_file(self.token1, None, "Test", "<p>Desc</p>", "test.txt", 1024, **self.http_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_file = json.loads(response.content.decode())

        # add file to labbook
        response = self.rest_add_labbook_element(
            self.token1, labbook.pk, File.get_content_type().id, decoded_file["pk"], 0, 10, 5, 8, **self.http_data
        )
        labbook_child_element_file = response.data
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # verify that this labbook now has two child element
        self.assertEqual(LabBook.objects.filter(pk=labbook.pk).first().child_elements.all().count(), 2)

        # fetch child elements via REST API and verify that it contains two child elements
        response = self.rest_get_labbook_elements(self.token1, labbook.pk, **self.http_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # decode it
        decoded_list = json.loads(response.content.decode())

        # verify it contains exactly two items
        self.assertEqual(len(decoded_list), 2)

        # get the labbooksection
        response = self.rest_get_labbooksection(self.token1, labbooksection.pk, **self.http_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["date"], self.dates["today"].isoformat())
        self.assertEqual(response.data["title"], "Section 1")
        self.assertEqual(response.data["child_elements"], [])

        # get the section child elements, should be 0
        response = self.rest_get_labbook_elements_for_section(
            self.token1, labbook.pk, labbooksection.pk, **self.http_data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        self.assertEqual(len(decoded_list), 0)

        # get the labbok child elements, should be 2
        response = self.rest_get_labbook_elements(self.token1, labbook.pk, **self.http_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        self.assertEqual(len(decoded_list), 2)

        # add the file to the labbook section
        response = self.rest_update_labbooksection(
            self.token1,
            labbooksection.pk,
            self.project1.pk,
            self.dates["today"],
            "Section 1",
            [labbook_child_element_file["pk"]],
            **self.http_data,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # get the section child elements, should be 1
        response = self.rest_get_labbook_elements_for_section(
            self.token1, labbook.pk, labbooksection.pk, **self.http_data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        self.assertEqual(len(decoded_list), 1)
        self.assertEqual(decoded_list[0]["child_object_content_type_model"], "shared_elements.file")
        self.assertEqual(decoded_list[0]["child_object"]["name"], "test.txt")

        # get the labbok child elements, should be 1
        response = self.rest_get_labbook_elements(self.token1, labbook.pk, **self.http_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        self.assertEqual(len(decoded_list), 1)
        self.assertEqual(decoded_list[0]["child_object_content_type_model"], "labbooks.labbooksection")
        self.assertEqual(decoded_list[0]["child_object"]["date"], self.dates["today"].isoformat())
        self.assertEqual(decoded_list[0]["child_object"]["title"], "Section 1")
        self.assertEqual(decoded_list[0]["child_object"]["child_elements"], [labbook_child_element_file["pk"]])
