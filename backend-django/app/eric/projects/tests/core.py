#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import os

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils.http import urlencode
from rest_framework import status
from rest_framework.status import HTTP_200_OK

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR
from eric.core.tests import custom_json_handler, HTTP_INFO
from eric.projects.models import Project, ProjectRoleUserAssignment, Role, RolePermissionAssignment, Resource
from eric.shared_elements.models import Contact

User = get_user_model()


def set_projects(data, pk_or_list):
    if pk_or_list:
        data['projects'] = get_pk_list(pk_or_list)


def get_pk_list(pk_or_list):
    return pk_or_list if isinstance(pk_or_list, list) else [pk_or_list]


class ModelPrivilegeMixin:
    """
    Mixin which provides several wrapper methods for the
    api/$model/$pk/privileges/ endpoint
    """

    def rest_get_privileges(self, auth_token, model, pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for an api call to retrieve all privileges for a given model and pk
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/{model}/{pk}/privileges/'.format(model=model, pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_privileges_for_user(self, auth_token, model, pk, user_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for an api call to retrieve privileges for a given model and pk and user_pk
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/{model}/{pk}/privileges/{user_pk}/'.format(model=model, pk=pk, user_pk=user_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_privilege(self, auth_token, model, pk, user_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for an api call to delete a privilege for a given model, pk and user
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/{model}/{pk}/privileges/{user_pk}/'.format(model=model, pk=pk, user_pk=user_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_create_privilege(self, auth_token, model, pk, user_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for an api call to create a new privilege for a given model, pk and user
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            'user_pk': user_pk
        }

        return self.client.post(
            '/api/{model}/{pk}/privileges/'.format(model=model, pk=pk),
            json.dumps(data, default=custom_json_handler), content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_privilege(self, auth_token, model, pk, user_pk, privilege, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for an api call to update an existing privilege for a given model, pk and user_pk
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.put(
            '/api/{model}/{pk}/privileges/{user_pk}/'.format(model=model, pk=pk, user_pk=user_pk),
            json.dumps(privilege, default=custom_json_handler), content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_patch_privilege(self, auth_token, model, pk, user_pk, privilege, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for an api call to update an existing privilege for a given model, pk and user_pk
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/{model}/{pk}/privileges/{user_pk}/'.format(model=model, pk=pk, user_pk=user_pk),
            json.dumps(privilege, default=custom_json_handler), content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )


class ChangeSetMixin:
    """ Mixin which provides several wrapper methods for the changeset (history) endpoint """

    def rest_get_changesets(self, auth_token, model, pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting the changeset for a specific model and pk """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/{model}/{pk}/history/'.format(model=model, pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_paginated_changesets(self, auth_token, model, pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting the changeset for a specific model and pk """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/{model}/{pk}/history_paginated/'.format(model=model, pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )


class TestLockMixin:
    """
    Mixin which provides the lock/unlock wrapper via REST API
    """

    def lock(self, auth_token, model, pk, HTTP_USER_AGENT, REMOTE_ADDR):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.post(
            '/api/{model}/{pk}/lock/'.format(model=model, pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def unlock(self, auth_token, model, pk, HTTP_USER_AGENT, REMOTE_ADDR):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.post(
            '/api/{model}/{pk}/unlock/'.format(model=model, pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def get_lock_status(self, auth_token, model, pk, HTTP_USER_AGENT, REMOTE_ADDR):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/{model}/{pk}/lock_status/'.format(model=model, pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )


class MeMixin:
    """ Helper methods for the /me/ endpoint """

    def rest_get_me(self, auth_token, assert_status=HTTP_200_OK,
                    http_user_agent=HTTP_INFO['HTTP_USER_AGENT'], remote_addr=HTTP_INFO['REMOTE_ADDR']
                    ):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)
        response = self.client.get(
            '/api/me/',
            HTTP_USER_AGENT=http_user_agent, REMOTE_ADDR=remote_addr
        )
        self.assertEqual(response.status_code, assert_status, response.content.decode())
        return response

    def rest_put_me(self, auth_token, data, assert_status=HTTP_200_OK,
                    http_user_agent=HTTP_INFO['HTTP_USER_AGENT'], remote_addr=HTTP_INFO['REMOTE_ADDR']
                    ):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)
        response = self.client.put(
            '/api/me/',
            data,
            content_type='application/json',
            HTTP_USER_AGENT=http_user_agent, REMOTE_ADDR=remote_addr
        )
        self.assertEqual(response.status_code, assert_status, response.content.decode())
        return response


class UserMixin:
    """ Mixin which provides several wrapper methods for the users endpoint """

    def rest_get_users(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a specific project via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/users/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_user_with_pk(self, auth_token, user_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a specific project via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/users/{}/'.format(user_pk),
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_for_users(self, auth_token, search_query, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a specific project via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/users/?search={}'.format(search_query),
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_invite_external_user(self, auth_token, email, message, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for inviting an ew external user via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.post(
            '/api/users/invite_user/',
            {
                'email': email,
                'message': message
            }, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )


class AuthenticationMixin:
    """ Mixin which provides login and logout methods for tests """

    def logout_with_token(self, token, HTTP_USER_AGENT='API_TEST_CLIENT', REMOTE_ADDR='127.0.0.1'):
        """ Checks if the token exists, then logs the user out, and checks that the token no longer exists """
        self.set_client_credentials(token)

        # call logout
        response = self.client.post('/api/auth/logout', HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

        # make sure the response is "logged_out"
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, "{\"status\":\"logged out\"}")

    def login_and_return_token(self, username, password, HTTP_USER_AGENT='API_TEST_CLIENT', REMOTE_ADDR='127.0.0.1'):
        """ logs in and returns the token
        checks with assert calls that the login was successful (token exists, user agent and remote addr are set)
        """
        # reset auth token in header, if it exists
        self.reset_client_credentials()

        # login with self.user1, a given user agent and remote address
        response = self.client.post('/api/auth/login',
                                    {'username': username, 'password': password},
                                    HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

        # check if login was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content.decode())
        self.assertContains(response, "{\"token\":\"")

        # check if the user exists
        avail_users = User.objects.filter(username=username)
        self.assertEqual(len(avail_users), 1)

        content = json.loads(response.content.decode())
        token = content['token']

        return token

    def set_client_credentials(self, token):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)

    def reset_client_credentials(self):
        self.client.credentials()

    def create_student_role(self):
        # create role 'Student' which has read access to projects
        role = Role.objects.create(name='Student')

        # get view_project permission
        view_project_permission = Permission.objects.filter(
            codename='view_project',
            content_type=Project.get_content_type()
        ).first()
        # and assign it to this role
        RolePermissionAssignment.objects.create(
            role=role,
            permission=view_project_permission
        )
        # get view_resource permission
        view_resource_permission = Permission.objects.filter(
            codename='view_resource',
            content_type=Resource.get_content_type()
        ).first()
        # and assign it to this role
        RolePermissionAssignment.objects.create(
            role=role,
            permission=view_resource_permission
        )
        return role

    def create_strict_observer_role(self):
        """ Creates a strictly observing role with view-permissions only """

        role = Role.objects.create(name='StrictObserver')

        perm_codenames = [
            "view_dmp",
            "view_dmp_form_data",
            "view_drive",
            "view_kanbanboard",
            "view_labbook",
            "view_picture",
            "view_project",
            "view_projectroleuserassignment",
            "view_resource",
            "view_contact",
            "view_contactattendsmeeting",
            "view_file",
            "view_meeting",
            "view_note",
            "view_task",
            "view_userattendsmeeting",
            "view_plugininstance",
        ]

        perms = Permission.objects.filter(codename__in=perm_codenames)
        RolePermissionAssignment.objects.bulk_create([
            RolePermissionAssignment(role=role, permission=perm)
            for perm in perms
        ])

        return role

    def create_role_without_change_related_project_permission(self):
        # create role 'can not change related project' which can read and change projects and contacts but can not
        # change the related project of the contact object
        role = Role.objects.create(name='CannotChangeRelatedProject')

        permissions = []

        # get view_project permission
        view_project_permission = Permission.objects.filter(
            codename='view_project',
            content_type=Project.get_content_type()
        ).first()
        permissions.append(view_project_permission)

        # get change_project permission
        edit_project_permission = Permission.objects.filter(
            codename='change_project',
            content_type=Project.get_content_type()
        ).first()
        permissions.append(edit_project_permission)

        # get view_contact permission
        view_contact_permission = Permission.objects.filter(
            codename='view_contact',
            content_type=Contact.get_content_type()
        ).first()
        permissions.append(view_contact_permission)

        # get change_contact permission
        edit_contact_permission = Permission.objects.filter(
            codename='change_contact',
            content_type=Contact.get_content_type()
        ).first()
        permissions.append(edit_contact_permission)

        for p in permissions:
            # and assign it to this role
            RolePermissionAssignment.objects.create(
                role=role,
                permission=p
            )
        return role


class ProjectsMixin:
    """ Mixin which provides some project helper methods for tests """

    def create_project(self, auth_token, project_name, project_description, project_state, HTTP_USER_AGENT,
                       REMOTE_ADDR):
        """
        Generic method for creating a project
        Does some simple checks
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # Make a REST API call for creating a project
        response = self.rest_create_project(auth_token, project_name, project_description, project_state,
                                            HTTP_USER_AGENT, REMOTE_ADDR)

        # project should have been created, HTTP response code should be 201
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response and load it into json
        content = response.content.decode()
        decoded_response = json.loads(content)

        self.assertTrue('"pk":' in content, msg="primary key (pk) in response")
        self.assertTrue('"name":"' + project_name + '"' in content, msg="correct project name in response")
        self.assertTrue('"project_state":"' + project_state + '"' in content, msg="correct project_state in response")
        self.assertTrue('"description":"' + project_description + '"' in content,
                        msg="correct project description in response")
        self.assertTrue('"display":' in content, msg="Project display (str method) in response")
        self.assertTrue('"created_at":' in content, msg="project created_at in response")
        self.assertTrue('"created_by":' in content, msg="created_by in response")

        pk = decoded_response['pk']
        self.assertEqual(decoded_response['name'], project_name)
        self.assertEqual(decoded_response['description'], project_description)
        self.assertEqual(decoded_response['project_state'], project_state)

        # see what the actual Project element from database looks like
        pro = Project.objects.get(pk=pk)

        self.assertEqual(pro.name, project_name)
        self.assertEqual(pro.description, project_description)
        self.assertEqual(pro.project_state, project_state)
        self.assertEqual(len(pro.contacts.all()), 0)

        self.assertEqual(pro.changesets.all().count(), 1)

        return pro

    def validate_create_project(self, token,
                                project_name='Test Project', project_description="Test Project Description",
                                HTTP_USER_AGENT="APITestClient", REMOTE_ADDR="127.0.0.1"):
        """
        Tries to create a project with the provided credentials
        Checks if the project has been created
        Checks if the user gets the permission "view_project" for the new project
        """
        # store the project length
        initial_project_length = Project.objects.all().count()

        project = self.create_project(
            token, project_name, project_description, Project.INITIALIZED,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEquals(project.name, project_name)
        self.assertEquals(project.description, project_description)

        self.assertEqual(Project.objects.all().count(), initial_project_length + 1,
                         msg="Validate that a new project has been created in the database")

        # check that this user has the default role (e.g., project manager)
        has_default_role = ProjectRoleUserAssignment.objects.filter(
            project=project,
            role__default_role_on_project_create=True
        )

        self.assertEqual(has_default_role.count(), 1,
                         msg="Validate that the user has the default role on project create")

        current_role = has_default_role.first().role

        # check that this user can view the project (has a role with permission 'view_project')
        role_permissions = current_role.permissions.all()

        self.assertTrue(
            role_permissions.filter(content_type=Project.get_content_type(), codename='view_project').exists(),
            msg="Validate that the user has the view_project role for the newly created project"
        )

        # try to get a list of projects from the API
        response = self.client.get('/api/projects/', HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        api_data = json.loads(response.content.decode())
        decoded = api_data['results']

        for item in decoded:
            self.assertTrue('created_by' in item,
                            msg="projects endpoint returned a json object with created_by in the project")
            self.assertTrue('name' in item,
                            msg="projects endpoint returned a json object with name in the project")
            self.assertTrue('project_state' in item,
                            msg="projects endpoint returned a json object with project_state in the project")
            self.assertTrue('description' in item,
                            msg="projects endpoint returned a json object with description in the project")

        return project

    def validate_assign_user_to_project(self, auth_token, project, user, role, HTTP_USER_AGENT, REMOTE_ADDR):
        response = self.rest_assign_user_to_project(auth_token, project, user, role, HTTP_USER_AGENT, REMOTE_ADDR)
        # assignment should have been created, HTTP response code should be 201
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response and load it into json
        content = response.content.decode()
        decoded_response = json.loads(content)

        self.assertTrue('"pk":' in content, msg="primary key (pk) in response")
        self.assertTrue('"role":' in content, msg="role in response")
        self.assertTrue('"user":' in content, msg="user in response")

        pk = decoded_response['pk']

        assignment = ProjectRoleUserAssignment.objects.get(pk=pk)
        return assignment

    def rest_get_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a specific project via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/projects/{}/'.format(project_pk),
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_projects(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """ WRapper for getting all projects via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/projects/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def get_all_projects_from_rest(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Gets all projects from REST API with the specified auth token
        """
        response = self.rest_get_projects(auth_token, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        api_data = json.loads(response.content.decode())
        return api_data['results']

    def validate_number_of_projects_returned_from_rest(self, token, number_projects, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Tries to get projects from REST API and validates the number of projects returned from rest equals
        number_projects
        """
        projects = self.get_all_projects_from_rest(token, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(len(projects), number_projects,
                          msg="Validates that the number of projects returned from the REST API is correct")

    def rest_create_project(self, auth_token, project_name, project_description, project_state, HTTP_USER_AGENT,
                            REMOTE_ADDR):
        """ Wrapper for creating a project via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.post(
            '/api/projects/',
            {
                'name': project_name,
                'description': project_description,
                'project_state': project_state
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_edit_project(self, auth_token, project_pk, project_name, project_description, project_state,
                          HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for editing a project via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.put(
            '/api/projects/{}/'.format(project_pk),
            {
                'name': project_name,
                'description': project_description,
                'project_state': project_state
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_set_parent_project(self, auth_token, project, parent):
        """
        Wrapper for setting the parent project of a project via REST
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # create a PATCH request for parent project
        return self.client.patch('/api/projects/{}/'.format(project.pk),
                                 {'parent_project': parent.pk},
                                 HTTP_USER_AGENT="Test API", REMOTE_ADDR="127.0.0.1")

    def rest_get_user_project_assignments(self, auth_token, project, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a user project assignment """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # Make a REST API call for creating a new project user role assignment entry
        return self.client.get(
            '/api/projects/%(project_pk)s/acls/' % {'project_pk': project.pk},
            {
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_user_project_assignment(self, auth_token, project, user, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a user project assignment """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # Make a REST API call for creating a new project user role assignment entry
        return self.client.get(
            '/api/projects/%(project_pk)s/acls/?user=%(user_pk)s' % {'project_pk': project.pk, 'user_pk': user.pk},
            {
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_assign_user_to_project(self, auth_token, project, user, role, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for assigning a user to a project with a certain role """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # Make a REST API call for creating a new project user role assignment entry
        return self.client.post(
            '/api/projects/%(project_pk)s/acls/' % {'project_pk': project.pk},
            {
                'user_pk': user.pk,
                'role_pk': role.pk,
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_edit_user_project_assignment(self, auth_token, project, assignment_pk, user, role, HTTP_USER_AGENT,
                                          REMOTE_ADDR):
        """ Wrapper for editing a user project assignment """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # Make a REST API call for updateing an assignment
        return self.client.put(
            '/api/projects/%(project_pk)s/acls/%(acl_pk)s/' % {'project_pk': project.pk, 'acl_pk': assignment_pk},
            {
                'user_pk': user.pk,
                'role_pk': role.pk,
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_user_from_project(self, auth_token, project_pk, assignment_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for deleting a user project assignment """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # Make a REST API call for deleting a user role project user role assignment entry
        return self.client.delete(
            '/api/projects/%(project_pk)s/acls/%(acl_pk)s/' % {'project_pk': project_pk, 'acl_pk': assignment_pk},
            {
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def edit_project(self, auth_token, project_pk, project_name, project_description, project_state, HTTP_USER_AGENT,
                     REMOTE_ADDR):
        response = self.rest_edit_project(auth_token, project_pk, project_name, project_description, project_state,
                                          HTTP_USER_AGENT, REMOTE_ADDR)

        # project should have been created, HTTP response code should be 201
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        project = Project.objects.get(pk=project_pk)

        self.assertEqual(project.name, project_name)
        self.assertEqual(project.description, project_description)
        self.assertEqual(project.project_state, project_state)

    def rest_duplicate_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for duplicate the project via REST
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # create a POST request for duplicate the project
        return self.client.post('/api/projects/%(project_pk)s/duplicate/' % {'project_pk': project_pk},
                                {},
                                HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_trash_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for trashing a project via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/projects/{pk}/soft_delete/'.format(pk=project_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for deleting a project via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/projects/{pk}/'.format(pk=project_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )


class ResourceMixin(TestLockMixin):
    """ Mixin which provides several wrapper methods for the resources (/api/resources/) endpoint """

    def rest_get_resource_export_link(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a resource
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/resources/{}/get_export_link/'.format(task_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_resources(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the resource endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/resources/?search={}'.format(search_string),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_resources_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the resource endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/resources/?recently_modified_by_me={}'.format(number_of_days),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_resource(self, auth_token, resource_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a resource by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/resources/{}/'.format(resource_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_query_resources(
            self, auth_token,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR,
            **kwargs
    ):
        """
        Queries resources using kwargs as query parameters.
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        params = urlencode(kwargs)
        url = f'/api/resources/?{params}'

        return self.client.get(url, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_resources(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of resources that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/resources/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_resources_for_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a list of resources for a specific project via REST API (using filter
        ?project={project_pk}) """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/resources/', {'project': project_pk},
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_export_resources(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for exporting a resource via REST API
        """
        return self.client.get(
            '/api/resources/export/',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_create_resource(
            self,
            auth_token,
            project_pks,
            name,
            description,
            resource_type,
            general_usage_setting,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
            responsible_unit=None,
            location=None,
            contact=None,
            terms_of_use_pdf=None,
            booking_rule_minimum_duration=None,
            booking_rule_maximum_duration=None,
            booking_rule_bookable_hours=None,
            booking_rule_minimum_time_before=None,
            booking_rule_maximum_time_before=None,
            booking_rule_time_between=None,
            booking_rule_bookings_per_user=None,
            **kwargs
    ):
        """
        Wrapper for creating a resource via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            'name': name,
            'description': description,
            'type': resource_type,
            'general_usage_setting': general_usage_setting,
        }

        if responsible_unit:
            data['responsible_unit'] = responsible_unit
        if location:
            data['location'] = location
        if contact:
            data['contact'] = contact
        if terms_of_use_pdf:
            # open file and post it to the rest api
            fp = open(os.path.join(
                os.path.dirname(__file__),
                "demo_files",
                terms_of_use_pdf
            ), 'rb')
            data['terms_of_use_pdf'] = fp
        if booking_rule_minimum_duration:
            data['booking_rule_minimum_duration'] = booking_rule_minimum_duration
        if booking_rule_maximum_duration:
            data['booking_rule_maximum_duration'] = booking_rule_maximum_duration
        if booking_rule_bookable_hours:
            data['booking_rule_bookable_hours'] = booking_rule_bookable_hours
        if booking_rule_minimum_time_before:
            data['booking_rule_minimum_time_before'] = booking_rule_minimum_time_before
        if booking_rule_maximum_time_before:
            data['booking_rule_maximum_time_before'] = booking_rule_maximum_time_before
        if booking_rule_time_between:
            data['booking_rule_time_between'] = booking_rule_time_between
        if booking_rule_bookings_per_user:
            data['booking_rule_bookings_per_user'] = booking_rule_bookings_per_user

        data.update(kwargs)

        set_projects(data, project_pks)

        response = self.client.post(
            '/api/resources/',
            data,
            format='multipart',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        return response

    def rest_delete_resource(self, auth_token, resource_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for deleting a resource via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/resources/{pk}/'.format(pk=resource_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_resource(self, auth_token, resource_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for restoring a resource via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/resources/{pk}/restore/'.format(pk=resource_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_resource(self, auth_token, resource_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for trashing a resource via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/resources/{pk}/soft_delete/'.format(pk=resource_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_resource(
            self,
            auth_token,
            resource_pk,
            project_pks,
            name,
            description,
            resource_type,
            general_usage_setting,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
            responsible_unit=None,
            location=None,
            contact=None,
            terms_of_use_pdf=None,
    ):
        """
        Wrapper for updating a resource via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            'name': name,
            'description': description,
            'type': resource_type,
            'general_usage_setting': general_usage_setting,
        }

        if responsible_unit:
            data['responsible_unit'] = responsible_unit
        if location:
            data['location'] = location
        if contact:
            data['contact'] = contact
        if terms_of_use_pdf:
            # open file and post it to the rest api
            fp = open(os.path.join(
                os.path.dirname(__file__),
                "demo_files",
                terms_of_use_pdf
            ), 'rb')
            data['terms_of_use_pdf'] = fp

        set_projects(data, project_pks)

        response = self.client.put(
            '/api/resources/{}/'.format(resource_pk),
            data,
            format='multipart',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        return response

    def rest_update_resource_project(self, auth_token, resource_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a resource
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            'projects': project_pks
        }

        return self.client.patch(
            '/api/resources/{}/'.format(resource_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def create_resource_orm(
            self,
            auth_token,
            project_pks,
            name,
            description,
            resource_type,
            general_usage_setting,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
            **kwargs,
    ):
        """ Wrapper for rest_create_Resource"""

        response = self.rest_create_resource(
            auth_token,
            project_pks,
            name,
            description,
            resource_type,
            general_usage_setting,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
            **kwargs,
        )
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return Resource.objects.get(pk=decoded['pk']), response
        else:
            return None, response
