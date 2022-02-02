#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.models import Permission
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import test_utils, HTTP_USER_AGENT, REMOTE_ADDR
from eric.projects.models import Project, Role
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ProjectsMixin
from eric.shared_elements.models import Comment
from eric.shared_elements.tests.core import CommentMixin

User = get_user_model()


# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

class CommentsTest(APITestCase, AuthenticationMixin, UserMixin, CommentMixin, ProjectsMixin):
    """
    Tests the /api/comments endpoint
    Tests for creating, retrieving and updating Comments
    Tests for Comments that are project-related and not project-related (permissions)
    """

    def setUp(self):
        """ Set up a couple of users and roles and projects """
        self.student_role = self.create_student_role()

        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name='User')

        # get add_comment and add_comment_without_project permission
        self.add_comment_permission = Permission.objects.filter(
            codename='add_comment',
            content_type=Comment.get_content_type()
        ).first()

        self.add_comment_without_project_permission = Permission.objects.filter(
            codename='add_comment_without_project',
            content_type=Comment.get_content_type()
        ).first()

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.token2 = self.login_and_return_token('student_2', 'foobar')
        self.user2.groups.add(self.user_group)

        # create a user without any special permissions
        self.user3 = User.objects.create_user(
            username='student_3', email='student_3@email.com', password='permission'
        )
        self.token3 = self.login_and_return_token('student_3', 'permission')

        # create two projects
        self.project1 = self.create_project(
            self.token1, "My Own Project (user1)",
            "Only user1 has access to this project", Project.STARTED,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project2 = self.create_project(
            self.token2, "Another Project (user2)",
            "Only user2 has access to this project", Project.STARTED,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # add user3 to project1
        response = self.rest_assign_user_to_project(
            self.token1, self.project1, self.user3, self.pm_role,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

    def test_create_comment_with_and_without_permission(self):
        """
        Tests creating a comment with and without the appropriate permission
        :return:
        """
        # there should be zero Comments to begin with
        self.assertEquals(Comment.objects.all().count(), 0, msg="There should be zero Comments to begin with")

        # try creating a comment without a project and without having the proper permission
        response = self.rest_create_comment(self.token3, None, "Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])

        # there should still be zero Comments
        self.assertEquals(Comment.objects.all().count(), 0, msg="There should still be zero Comments")

        # however, creating a comment for a project1 should work, as user1 has created project1 (and therefore should have
        # the needed permissions)
        response = self.rest_create_comment(self.token3, self.project1.pk, "Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # now give the user the global add_comment permission
        self.user3.user_permissions.add(self.add_comment_without_project_permission)

        # try creating a comment without a project now, and it should work
        response = self.rest_create_comment(self.token3, None,
                                            "Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be two Comments
        self.assertEquals(Comment.objects.all().count(), 2, msg="There should be two Comments in the database")

        # and those two should be viewable by the current user
        response = self.rest_get_comments(self.token3, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Comments
        self.assertEqual(len(decoded), 2, msg="There should be two Comments viewable by the user")

        # revoke add_comment_permission of user
        self.user3.user_permissions.remove(self.add_comment_permission)
        # and give the user the add_comment_without_project permission
        self.user3.user_permissions.add(self.add_comment_without_project_permission)

        # try creating a comment without a project now, and it should work
        response = self.rest_create_comment(self.token3, None,
                                            "Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be three Comments
        self.assertEquals(Comment.objects.all().count(), 3, msg="There should be three Comments in the database")

        # and those two should be viewable by the current user
        response = self.rest_get_comments(self.token3, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Comments
        self.assertEqual(len(decoded), 3, msg="There should be three Comments viewable by the user")

    def test_get_comments_with_filter(self):
        """
        Tests creating and retrieving Comments that are not associated to a project
        :return:
        """

        # add permission for creating Comments to the current user
        self.user1.user_permissions.add(self.add_comment_without_project_permission)

        # there should be zero Comments
        self.assertEquals(Comment.objects.all().count(), 0, msg="There should be zero Comments to begin with")

        # get all existing Comments (there should be zero Comments)
        response = self.rest_get_comments(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Comments
        self.assertEqual(len(decoded), 0, msg="/Comments/ endpoint should return zero Comments")

        # try to query the same endpoint with a project_pk (should still be zero Comments)
        response = self.rest_get_comments_for_project(self.token1, self.project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Comments
        self.assertEqual(len(decoded), 0, msg="/Comments/?project=1234-abcd endpoint should return zero Comments")

        # create a comment without depending on a project
        response = self.rest_create_comment(self.token1, None, "Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get comment object from db
        comment = Comment.objects.get(pk=decoded['pk'])
        # verify that the comment object was stored and returned properly
        self.assertEquals(decoded['pk'], str(comment.pk))

        ########
        # create a comment for project1
        ########
        response = self.rest_create_comment(self.token1, self.project1.pk, "Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get comment object from db
        comment = Comment.objects.get(pk=decoded['pk'])
        # verify that the comment object was stored and returned properly
        self.assertEquals(decoded['pk'], str(comment.pk))

        # and there should be two Comments "viewable" by the current user
        response = self.rest_get_comments(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Comments
        self.assertEqual(len(decoded), 2, msg="There should be two Comments viewable by the user")

        # and also three Comments returned from the endpoint
        response = self.rest_get_comments(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Comments
        self.assertEqual(len(decoded), 2, msg="/Comments/ endpoint should return two Comments")

    def test_user_can_only_see_Comments_created_by_own_user(self):
        """
        Tests whether the user can only see Comments created by the own user, not by other users
        :return:
        """
        # add permission for creating Comments to user1
        self.user1.user_permissions.add(self.add_comment_without_project_permission)

        # add permission for creating Comments to user2
        self.user2.user_permissions.add(self.add_comment_without_project_permission)

        # there should be zero Comments
        self.assertEquals(Comment.objects.all().count(), 0, msg="There should be zero Comments to begin with")

        # try creating a comment without a project for user1 (token1)
        response = self.rest_create_comment(self.token1, None,
                                            "Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # try creating a comment without a project for user2 (token2)
        response = self.rest_create_comment(self.token2, None,
                                            "Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should be two Comments
        self.assertEqual(Comment.objects.all().count(), 2, msg="There should be two Comments")

        # try quering the rest endpoint for user1 - there should only be one comment
        response = self.rest_get_comments(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Comments
        self.assertEqual(len(decoded), 1, msg="There should only be one comment visible for user1")

        # try quering the rest endpoint for user2 - there should only be one comment
        response = self.rest_get_comments(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Comments
        self.assertEqual(len(decoded), 1, msg="There should only be one comment visible for user2")

    def test_create_and_get_comments(self):
        """ Test getting all users and finding specific users """
        project = self.create_project(self.token1, "My Own Project", "Nobody else has access to this project",
                                      Project.STARTED, HTTP_USER_AGENT, REMOTE_ADDR)

        # get all Comments from rest api for this project
        response = self.rest_get_comments_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Comments
        self.assertEqual(len(decoded), 0)

        # create a comment
        comment, response = self.create_comment_orm(self.token1, project.pk, "Test Description",
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get all Comments from rest api for this project
        response = self.rest_get_comments_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)

        # should contain exactly one Comments
        self.assertEqual(len(decoded), 1)

        # create another comment
        response = self.rest_create_comment(self.token1, project.pk, "Another Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get all Comments from rest api for this project
        response = self.rest_get_comments_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)

        # should contain exactly two Comments
        self.assertEqual(len(decoded), 2)

        # update first comment
        response = self.rest_update_comment(self.token1, comment.pk, project.pk, "Test Comment Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # get comment object from db
        comment = Comment.objects.get(pk=decoded['pk'])

    def test_create_and_edit_of_own_comment(self):
        """ Tests creating and editing of a comment with the same user (should work) and with a different user
        (which should not work)
        """
        # add permission for creating Comments to the current user
        self.user1.user_permissions.add(self.add_comment_without_project_permission)

        # there should be zero Comments to begin with
        self.assertEquals(Comment.objects.all().count(), 0, msg="There should be zero Comments to begin with")

        # try creating a comment without a project
        comment, response = self.create_comment_orm(self.token1, None, "Test Description",
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be one comment
        self.assertEquals(Comment.objects.all().count(), 1, msg="There should be one comment in the database")

        # try edit this comment with user1
        response = self.rest_update_comment(self.token1, comment.pk, None, "Test Description",
                                            HTTP_USER_AGENT,
                                            REMOTE_ADDR)

        decoded = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try reading infos about this comment with user2 (should not work)
        response = self.rest_get_comment(self.token2, decoded['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # try updating this comment with user2 (should also not work)
        response = self.rest_update_comment(self.token2, decoded['pk'], None, "Test Description",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
