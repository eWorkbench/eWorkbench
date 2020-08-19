#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.status import HTTP_201_CREATED, HTTP_200_OK, HTTP_404_NOT_FOUND, HTTP_204_NO_CONTENT
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_INFO
from eric.core.tests.test_utils import CommonTestMixin
from eric.model_privileges.models import ModelPrivilege
from eric.projects.models import Project, ALL_PROJECTS_CACHE_KEY
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin

User = get_user_model()


class ProjectCachingTest(APITestCase, AuthenticationMixin, ProjectsMixin, CommonTestMixin, ModelPrivilegeMixin):

    def setUp(self):
        # create superuser (so we don't need to care about permissions, etc.)
        self.user = User.objects.create_superuser(username="su", email="su@test.local", password="password")
        self.token = self.login_and_return_token('su', 'password')

        # create a normal user
        self.user2 = User.objects.create_user(username='user2', email='user2@test.local', password='password')
        self.token2 = self.login_and_return_token('user2', 'password')

        # set up role for project management
        self.student_role = self.create_student_role()

        # sanity-check setup
        # there will be one automatically created project (from auto_create_project_for_user handler)
        self.assertEquals(Project.objects.all().count(), 1)

        # completely clear cache, just to make sure
        cache.clear()

    def test_projects_are_cached_on_first_request(self):
        # create simple project
        response1 = self.rest_create_project(
            self.token, "CachedProject", "Description", Project.STARTED,
            **HTTP_INFO
        )
        self.assert_response_status(response1, HTTP_201_CREATED)

        # request project list
        requested_projects = self.get_all_projects_from_rest(self.token, **HTTP_INFO)
        self.assertEqual(len(requested_projects), 2)
        project_names_from_api = [p['name'] for p in requested_projects]
        self.assertEqual(len(project_names_from_api), 2)
        self.assertTrue("CachedProject" in project_names_from_api)

        # check that the project is cached now
        cached = cache.get(ALL_PROJECTS_CACHE_KEY)
        self.assertIsNotNone(cached)
        self.assertEqual(len(cached), 2)
        project_names_from_cache = [p.name for p in cached]
        self.assertTrue("CachedProject" in project_names_from_cache)

    def test_cache_is_updated_on_change(self):
        # create simple project
        response1 = self.rest_create_project(
            self.token, "Project1", "Description", Project.STARTED,
            **HTTP_INFO
        )
        project_from_response = self.parse_response(response1, HTTP_201_CREATED)
        project_pk = project_from_response['pk']

        # modify project
        response2 = self.rest_edit_project(
            self.token,
            project_pk=project_pk,
            project_name="Project1-MOD",
            project_description="HELLO MY FRIEND",
            project_state=Project.STARTED,
            **HTTP_INFO
        )
        self.assert_response_status(response2, HTTP_200_OK)

        # check that the new data is provided
        response3 = self.rest_get_project(self.token, project_pk, **HTTP_INFO)
        project = self.parse_response(response3)
        self.assertEqual(project['name'], 'Project1-MOD')
        self.assertEqual(project['description'], 'HELLO MY FRIEND')

        # trash+delete project
        response4 = self.rest_trash_project(self.token, project_pk, **HTTP_INFO)
        self.assert_response_status(response4, HTTP_200_OK)
        response5 = self.rest_delete_project(self.token, project_pk, **HTTP_INFO)
        self.assert_response_status(response5, HTTP_204_NO_CONTENT)

        # check that the detail API does not provide the deleted project
        response6 = self.rest_get_project(self.token, project_pk, **HTTP_INFO)
        self.assert_response_status(response6, HTTP_404_NOT_FOUND)

        # check that the list API does not provide the deleted project
        requested_projects = self.get_all_projects_from_rest(self.token, **HTTP_INFO)
        self.assertEqual(len(requested_projects), 1)

        # check that the cache is updated
        # (must be done after an API request, otherwise the cache will be empty from the invalidation)
        cached_projects = cache.get(ALL_PROJECTS_CACHE_KEY)
        self.assertEqual(len(cached_projects), 1)

    def test_project_tree(self):
        """ Tests that the viewable project tree is not cached and correct for any user """

        # set up some project hierarchy
        self.create_project(self.token, "A", "desc", Project.STARTED, *HTTP_INFO)
        prj_B = self.create_project(self.token, "B", "desc", Project.STARTED, *HTTP_INFO)
        prj_B1 = self.create_project(self.token, "B1", "desc", Project.STARTED, *HTTP_INFO)
        prj_B2 = self.create_project(self.token, "B2", "desc", Project.STARTED, *HTTP_INFO)
        prj_B2x = self.create_project(self.token, "B2x", "desc", Project.STARTED, *HTTP_INFO)
        self.create_project(self.token, "C", "desc", Project.STARTED, *HTTP_INFO)

        self.rest_set_parent_project(self.token, prj_B1, prj_B)
        self.rest_set_parent_project(self.token, prj_B2, prj_B)
        self.rest_set_parent_project(self.token, prj_B2x, prj_B2)

        # allow access for user2 on B, but not on sub projects
        self.rest_assign_user_to_project(self.token, prj_B, self.user2, self.student_role, **HTTP_INFO)
        self.rest_create_privilege(self.token, 'projects', prj_B.pk, self.user2.pk, **HTTP_INFO)
        self.rest_patch_privilege(
            self.token, 'projects', prj_B.pk, self.user2.pk, {
                'view_privilege': ModelPrivilege.ALLOW
            }, **HTTP_INFO
        )
        self.rest_create_privilege(self.token, 'projects', prj_B1.pk, self.user2.pk, **HTTP_INFO)
        self.rest_patch_privilege(
            self.token, 'projects', prj_B1.pk, self.user2.pk, {
                'view_privilege': ModelPrivilege.DENY
            }, **HTTP_INFO
        )
        self.rest_create_privilege(self.token, 'projects', prj_B2.pk, self.user2.pk, **HTTP_INFO)
        self.rest_patch_privilege(
            self.token, 'projects', prj_B2.pk, self.user2.pk, {
                'view_privilege': ModelPrivilege.DENY
            }, **HTTP_INFO
        )
        self.rest_create_privilege(self.token, 'projects', prj_B2x.pk, self.user2.pk, **HTTP_INFO)
        self.rest_patch_privilege(
            self.token, 'projects', prj_B2x.pk, self.user2.pk, {
                'view_privilege': ModelPrivilege.DENY
            }, **HTTP_INFO
        )

        # clear cache and check project_tree for different users and requests
        def check_project_tree_for_user(user_token):
            response = self.rest_get_project(user_token, prj_B.pk, **HTTP_INFO)
            project_from_api = self.parse_response(response)
            project_tree = project_from_api['project_tree']
            self.assertEqual(len(project_tree), 4, str(project_tree))
            project_names_in_tree = set(p['name'] for p in project_tree)
            self.assertEqual(
                project_names_in_tree.difference({'B', 'B1', 'B2', 'B2x'}),
                set(),
                str(project_names_in_tree)
            )

        cache.clear()
        check_project_tree_for_user(self.token2)
        check_project_tree_for_user(self.token)
