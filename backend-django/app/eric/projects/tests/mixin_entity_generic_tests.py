#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from datetime import timedelta

from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils.translation import ugettext_lazy as _
from django_changeset.models import RevisionModelMixin

from rest_framework import status

from eric.core.models import disable_permission_checks
from eric.kanban_boards.tests.core import KanbanBoardMixin
from eric.labbooks.tests.core import LabbookSectionMixin

from eric.projects.models import Project, ProjectRoleUserAssignment, Role
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin, ChangeSetMixin
from eric.shared_elements.tests.core import TaskMixin, NoteMixin, ContactMixin, FileMixin
from eric.shared_elements.models import Task
from eric.model_privileges.models import ModelPrivilege
from eric.core.tests import test_utils

User = get_user_model()

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class EntityChangeRelatedProjectTestMixin(AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin, TaskMixin,
                                          NoteMixin, ContactMixin, FileMixin, LabbookSectionMixin,
                                          ChangeSetMixin):
    """
    Mixin which tests several API endpoints of the given "entity"
    """
    entity = None
    data = None

    def superSetUp(self):
        """
        Create three users
        :return:
        """
        self.student_role = self.create_student_role()
        self.observer_role = Role.objects.filter(name="Observer").first()
        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name='User')

        # get add_task and add_task_without_project permission
        self.add_task_permission = Permission.objects.filter(
            codename='add_task',
            content_type=Task.get_content_type()
        ).first()

        self.add_task_without_project_permission = Permission.objects.filter(
            codename='add_task_without_project',
            content_type=Task.get_content_type()
        ).first()

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        # create a user without any special permissions
        self.user3 = User.objects.create_user(
            username='student_3', email='student_3@email.com', password='permission'
        )

        self.superuser = User.objects.create_user(
            username='superuser', email='super@user.com', password='sudo', is_superuser=True,
        )

        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.token2 = self.login_and_return_token('student_2', 'foobar')
        self.token3 = self.login_and_return_token('student_3', 'permission')
        self.superuser_token = self.login_and_return_token('superuser', 'sudo')

        # create two projects
        self.project1 = self.create_project(
            self.token1, "My Own Project (user1)",
            "Only user1 has access to this project", "START",
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project2 = self.create_project(
            self.token2, "Another Project (user2)",
            "Only user2 has access to this project", "START",
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # add user3 to project1
        self.rest_assign_user_to_project(
            self.token1, self.project1, self.user3, self.pm_role,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_generic_create_entity(self, token, index):
        """
        Generic method for creating a new entity via REST API
        :param token: the auth token
        :param index: index for the data to used (defined in self.data)
        :return: response
        """
        data = self.data[index]

        # check if there is a method called "rest_create_{entity_name}"
        method_name = "rest_create_{entity_name}".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self, method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        # call handler
        return handler(token, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **data)

    def rest_generic_update_entity(self, token, pk, index):
        """
        Generic method for updating a new entity via REST API
        :param token: the auth token
        :param index: index for the data to used (defined in self.data)
        :return: response
        """
        data = self.data[index]

        # check if there is a method called "rest_update_{entity_name}"
        method_name = "rest_update_{entity_name}".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        # call handler
        return handler(token, pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **data)

    def rest_generic_get_export_link_entity(self, token, pk):
        """
        Generic method for getting an export link of an entity from REST API
        :param token: the auth token
        :param pk: the primary key of the object that should be retrieved via REST API
        :return: response
        """
        # check if there is a method called "rest_update_{entity_name}"
        method_name = "rest_get_{entity_name}_export_link".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        return handler(token, pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_get_entity(self, token, pk):
        """
        Generic method for getting an entity from REST API
        :param token: the auth token
        :param pk: the primary key of the object that should be retrieved via REST API
        :return: response
        """
        # check if there is a method called "rest_get_{entity_name}"
        method_name = "rest_get_{entity_name}".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        return handler(token, pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_lock_entity(self, token, pk):
        from eric.projects.tests.core import TestLockMixin

        if isinstance(self, TestLockMixin):
            modelname = self.model_to_model_name_plural()
            response = self.lock(token, modelname, pk, HTTP_USER_AGENT, REMOTE_ADDR)

            return response

        # else:
        return None

    def rest_generic_unlock_entity(self, token, pk):
        from eric.projects.tests.core import TestLockMixin

        if isinstance(self, TestLockMixin):
            modelname = self.model_to_model_name_plural()
            response = self.unlock(token, modelname, pk, HTTP_USER_AGENT, REMOTE_ADDR)

            return response

        # else:
        return None

    def rest_generic_get_lock_status(self, token, pk):
        from eric.projects.tests.core import TestLockMixin
        if isinstance(self, TestLockMixin):
            modelname = self.model_to_model_name_plural()
            response = self.get_lock_status(token, modelname, pk, HTTP_USER_AGENT, REMOTE_ADDR)

            return response

        # else: not locked
        return None

    def rest_generic_trash_entity(self, token, pk):
        """
        Generic method for trashing an entity via REST API
        :param token: the auth token
        :param pk: the primary key of the object that should be trashed via REST API
        :return: response
        """
        # check if there is a method called "rest_trash_{entity_name}"
        method_name = "rest_trash_{entity_name}".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        # call handler
        return handler(token, pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_restore_entity(self, token, pk):
        """
        Generic method for restoring an entity via REST API
        :param token: the auth token
        :param pk: the primary key of the object that should be restored via REST API
        :return: response
        """
        # check if there is a method called "rest_restore_{entity_name}"
        method_name = "rest_restore_{entity_name}".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        # call handler
        return handler(token, pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_delete_entity(self, token, pk):
        """
        Generic method for deleting an entity via REST API
        :param token: the auth token
        :param pk: the primary key of the object that should be deleted via REST API
        :return: response
        """
        # check if there is a method called "rest_delete_{entity_name}"
        method_name = "rest_delete_{entity_name}".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        # call handler
        return handler(token, pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_list_entity(self, token):
        """
        Generic method for getting a list of entities from REST API
        :param token: the auth token
        :return: response
        """
        # check if there is a method called "rest_get_{entity_name}s"
        method_name = "rest_get_{entity_name}s".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        return handler(token, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_recently_modified_by_me(self, token, number_of_days):
        """
        Generic method for performing a search for entities that have been recently modified by the current user
        :param token:
        :param number_of_days:
        :return:
        """
        # check if there is a method called "rest_get_{entity_name}s"
        method_name = "rest_get_{entity_name}s_recently_modified_by_me".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        return handler(token, number_of_days, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_search_entity(self, token, search_string):
        """
        Generic method for performing a full text search of an entity via REST API
        :param token: the auth token
        :param search_string: search string
        :return: response
        """
        # check if there is a method called "rest_get_{entity_name}s"
        method_name = "rest_search_{entity_name}s".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        return handler(token, search_string, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_set_project(self, token, pk, project_pks):
        """
        Generic method for setting the project of an entity via REST API
        :param token:
        :param pk:
        :param project_pks: list
        :return: response
        """
        # check if there is a method called "rest_get_{entity_name}s"
        method_name = "rest_update_{entity_name}_project".format(entity_name=self.entity.__name__.lower())
        handler = getattr(self, method_name, None)

        # assert that the method exists and is callable
        assert hasattr(self,
                       method_name), "EntityChangeRelatedProjectTestMixin needs to have a mixin with the method " + method_name
        assert callable(handler), "Method " + method_name + " is not callable"

        return handler(token, pk, project_pks, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def model_to_model_name_plural(self):
        modelname = self.entity.__name__.lower() + "s"

        return modelname

    def rest_generic_get_privileges(self, token, pk):
        """
        Generic method for retrieving the privileges of an entity via REST API
        :param token:
        :param pk:
        :return: response
        """
        modelname = self.model_to_model_name_plural()

        return self.rest_get_privileges(token, modelname, pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_create_privilege(self, token, pk, user_pk):
        """
        Generic method for creating a new model privilege
        :param token:
        :param pk:
        :param user:
        :return: response
        """
        modelname = self.model_to_model_name_plural()

        return self.rest_create_privilege(token, modelname, pk, user_pk,
                                          HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_patch_privilege(self, token, pk, user_pk, privilege):
        """
        Generic method for updating a new model privilege
        :param token:
        :param pk:
        :param user_pk:
        :param privilege:
        :return: response
        """
        modelname = self.model_to_model_name_plural()

        return self.rest_patch_privilege(token, modelname, pk, user_pk, privilege,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_update_privilege(self, token, pk, user_pk, privilege):
        """
        Generic method for updating a model privilege
        :param token:
        :param pk:
        :param user_pk:
        :param privilege:
        :return: response
        """
        modelname = self.model_to_model_name_plural()

        return self.rest_update_privilege(token, modelname, pk, user_pk, privilege,
                                          HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_delete_privilege(self, token, pk, user_pk):
        """
        Generic method for deleting a model privilege
        :param token:
        :param pk:
        :param user_pk:
        :return:
        """
        modelname = self.model_to_model_name_plural()

        return self.rest_delete_privilege(token, modelname, pk, user_pk,
                                          HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_generic_get_changeset(self, token, pk):
        """
        Generic method for retrieving the changeset for a given model and pk
        :param token:
        :param pk:
        :return:
        """
        modelname = self.model_to_model_name_plural()

        return self.rest_get_changesets(token, modelname, pk,
                                        HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def test_create_entity(self):
        """
        Tries creating the entity via REST API and verifies that it exists in the database
        Also verifies that a changeset entry was created
        :return:
        """
        response = self.rest_generic_create_entity(self.token1, 0)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # verify the entry exists in the database
        self.assertEquals(self.entity.objects.filter(pk=decoded_response['pk']).exists(), True)
        element = self.entity.objects.filter(pk=decoded_response['pk']).first()

        # verify that a changeset entry was created
        self.assertEquals(element.changesets.count(), 1)

        # verify that created_by and last_modified_by is set
        self.assertEquals(element.created_by.pk, self.user1.pk)
        self.assertEquals(element.last_modified_by.pk, self.user1.pk)

        # try to get the changeset for this element
        response = self.rest_generic_get_changeset(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue('count' in decoded_response, msg="History Response is paginated")
        self.assertTrue('results' in decoded_response, msg="History Response is paginated")
        self.assertEquals(decoded_response['count'], 1, msg="There should be one changeset entry")
        self.assertEquals(len(decoded_response['results']), 1, msg="There should be one changeset entry")

    def test_create_entity_without_permission(self):
        """
        Tries creating the entity via REST API without having the correct permissions (user3)
        :return:
        """
        response = self.rest_generic_create_entity(self.token3, 0)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])
        decoded_response = json.loads(response.content.decode())

    def test_retrieve_entity(self):
        """
        Tries creating the entity with user1, and retrieving it with another user (should not work)
        and vice versa
        :return:
        """
        response = self.rest_generic_create_entity(self.token1, 0)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # verify the entry exists in the database
        self.assertEquals(self.entity.objects.filter(pk=decoded_response['pk']).exists(), True)
        element = (self.entity.objects.filter(pk=decoded_response['pk']).first())

        # try to get the element from REST API with user 1 (should work)
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEquals(decoded_response['pk'], str(element.pk))

        # try to get the element from REST API with user 2 (should not work)
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # try to get the element from REST API with user 3 (should not work)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # now do the same with user2: create a new task, which only user2 should see
        response = self.rest_generic_create_entity(self.token2, 1)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # verify the entry exists in the database
        self.assertEquals(self.entity.objects.filter(pk=decoded_response['pk']).exists(), True)
        element = (self.entity.objects.filter(pk=decoded_response['pk']).first())

        # try to get the element from REST API with user 2 (should work)
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to get the element from REST API with user 1 (should not work)
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # try to get the element from REST API with user 3 (should not work)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # now get lists of those elements for each user, and verify the amount of elements visible for each user
        # User 1 should see 1 element
        response = self.rest_generic_list_entity(self.token1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 1 should see exactly one element")

        # User 2 should see 1 element
        response = self.rest_generic_list_entity(self.token2)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see exactly one element")

        # User 3 should see 0 elements
        response = self.rest_generic_list_entity(self.token3)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 0, msg="User 3 should see exactly zero elements")

    def test_trash_entity(self):
        """
        Tests trashing an entity
        :return:
        """
        element = self.generic_create_entity_and_return_from_db(self.token1, 0)

        # verify that this element is not trashed
        self.assertEquals(element.deleted, False)
        self.assertEquals(self.entity.objects.trashed().filter(pk=element.pk).count(), 0)

        response = self.rest_generic_trash_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        element.refresh_from_db()

        # check that the element has been trashed
        self.assertEquals(self.entity.objects.trashed().filter(pk=element.pk).count(), 1)
        self.assertEquals(element.deleted, True)

        # this should also have created a changerecord containing the field deleted, changed to True
        self.assertEquals(element.changesets.count(), 2)
        self.assertEquals(element.changesets.all()[0].changeset_type, "S")  # is a soft delete
        self.assertEquals(element.changesets.all()[0].change_records.filter(field_name='deleted').count(), 1)
        self.assertEquals(element.changesets.all()[0].change_records.filter(field_name='deleted')[0].new_value, 'True')

        # modifying a trashed element should not work
        response = self.rest_generic_update_entity(self.token1, element.pk, 1)
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue("not allowed to edit an already trashed object" in response.content.decode())

    def test_restore_entity(self):
        """
        Tests restoring a trashed entity
        :return:
        """
        element = self.generic_create_entity_and_return_from_db(self.token1, 0)

        # verify that this element is not trashed
        self.assertEquals(element.deleted, False)
        self.assertEquals(self.entity.objects.trashed().filter(pk=element.pk).count(), 0)

        response = self.rest_generic_trash_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # refresh element
        element.refresh_from_db()

        self.assertEquals(element.deleted, True)
        self.assertEquals(self.entity.objects.trashed().filter(pk=element.pk).count(), 1)

        # now try to restore it
        response = self.rest_generic_restore_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # refresh element
        element.refresh_from_db()

        self.assertEquals(element.deleted, False)
        self.assertEquals(self.entity.objects.trashed().filter(pk=element.pk).count(), 0)

    def test_delete_entity(self):
        """
        Tries to delete an entity after trashing it
        :return:
        """
        element = self.generic_create_entity_and_return_from_db(self.token1, 0)

        # verify that this element is not trashed
        self.assertEquals(element.deleted, False)
        self.assertEquals(self.entity.objects.trashed().filter(pk=element.pk).count(), 0)

        # trash it
        response = self.rest_generic_trash_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now try to delete the entity => must fail as normal user
        response = self.rest_generic_delete_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # delete as superuser (must work)
        response = self.rest_generic_delete_entity(self.superuser_token, element.pk)
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)

        # try to find the element in database
        self.assertEquals(self.entity.objects.filter(pk=element.pk).count(), 0)

    def test_can_not_delete_entity_without_trashing_it_first(self):
        """
        Tries to delete an entity without trashing it first
        This should not work, an entity must always be trashed before it can be deleted
        :return:
        """
        element = self.generic_create_entity_and_return_from_db(self.token1, 0)

        # verify that this element is not trashed
        self.assertEquals(element.deleted, False)

        # try to delete it (should not work)
        response = self.rest_generic_delete_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        decoded_response = json.loads(response.content.decode())
        print(decoded_response)

        # verify element still exists
        self.assertEquals(self.entity.objects.filter(pk=element.pk).count(), 1)
        self.assertEquals(self.entity.objects.trashed().filter(pk=element.pk).count(), 0)

    def test_trash_entity_without_permission(self):
        """
        Tests trashing an element without having the proper permission/privilege
        :return:
        """
        element, user2_privilege = self.generic_create_entity_and_add_another_user(0, self.user2)

        # unlock the element with user1
        self.rest_generic_unlock_entity(self.token1, element.pk)

        # try to trash the element with user2 (should not work)
        response = self.rest_generic_trash_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)
        # try to trash the element with user3 (should not work)
        response = self.rest_generic_trash_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # element should not be trashed
        element.refresh_from_db()
        self.assertEquals(element.deleted, False)

        # give user2 the view privilege
        user2_privilege['view_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 and user3 should still not be able to trash the element
        # try to trash the element with user2 (should not work)
        response = self.rest_generic_trash_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)
        # try to trash the element with user3 (should not work)
        response = self.rest_generic_trash_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # element should still not be trashed
        element.refresh_from_db()
        self.assertEquals(element.deleted, False)

        # give user2 privilege "TRASH" for this element
        user2_privilege['trash_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to trash the element with user2 (should work now)
        response = self.rest_generic_trash_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # try to trash the element with user3 (should not work)
        response = self.rest_generic_trash_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # element should now be trashed
        element.refresh_from_db()
        self.assertEquals(element.deleted, True)

    def test_restore_entity_without_permission(self):
        """
        Tests restoring an entity without having proper permissions
        :return:
        """
        element, user2_privilege = self.generic_create_entity_and_add_another_user(0, self.user2)

        # trash element with user1
        response = self.rest_generic_trash_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        element.refresh_from_db()
        # should be trashed
        self.assertEquals(element.deleted, True)

        # unlock the element with user1
        self.rest_generic_unlock_entity(self.token1, element.pk)

        # give user2 view privilege
        user2_privilege['view_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 and user3 should not be able to restore the element
        response = self.rest_generic_restore_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)
        # try to restore the element with user3 (should not work)
        response = self.rest_generic_restore_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        element.refresh_from_db()
        # should still be trashed
        self.assertEquals(element.deleted, True)

        # give user2 the restore privilege
        user2_privilege['restore_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should be able to restore
        response = self.rest_generic_restore_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        element.refresh_from_db()
        # should no longer be trashed
        self.assertEquals(element.deleted, False)

    def test_create_update_delete_privilege(self):
        """
        Tests creating, updating and deleting a privilege
        :return:
        """
        element, user2_privilege = self.generic_create_entity_and_add_another_user(0, self.user2)

        # give user2 view privilege
        user2_privilege['view_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # update the privilege, also give the edit privilege
        user2_privilege['edit_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # assuming user2 is hostile and wants to delete the privilege of user1 (should not work, as user2 does not have
        # the full access privilege)
        response = self.rest_generic_delete_privilege(self.token2, element.pk, self.user1.pk)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # user2 is also not able to delete itself from the object (as user2 does not have the full access privilege)
        response = self.rest_generic_delete_privilege(self.token2, element.pk, self.user2.pk)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # remove the privilege of user2
        response = self.rest_generic_delete_privilege(self.token1, element.pk, self.user2.pk)
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)

        # get all privileges
        response = self.rest_generic_get_privileges(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        privileges = json.loads(response.content.decode())

        self.assertEquals(len(privileges), 1, msg="There should be exactly one privilege")

        # user2 should not be able to view the privileges
        response = self.rest_generic_delete_privilege(self.token2, element.pk, self.user1.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # now try to delete this last privilege (which should fail, as the last privilege can not be deleted)
        response = self.rest_generic_delete_privilege(self.token1, element.pk, self.user1.pk)
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_entity_without_permission(self):
        """
        Tests deleting an element without proper permission
        :return:
        """
        element, user2_privilege = self.generic_create_entity_and_add_another_user(0, self.user2)

        # trash element with user1
        response = self.rest_generic_trash_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        element.refresh_from_db()
        # should be trashed
        self.assertEquals(element.deleted, True)

        # give user2 view privilege
        user2_privilege['view_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 and user3 should not be able to delete the element
        response = self.rest_generic_delete_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)
        # try to delete the element with user3 (should not work)
        response = self.rest_generic_delete_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        element.refresh_from_db()
        # should still be trashed
        self.assertEquals(element.deleted, True)

        # give user2 the edit and delete privilege
        user2_privilege['edit_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        user2_privilege['delete_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should still not be able to delete (only superuser can delete)
        response = self.rest_generic_delete_entity(self.token2, element.pk)
        print(response.content.decode())
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # element should still be in database
        self.assertEquals(self.entity.objects.filter(pk=element.pk).count(), 1)

    def test_change_related_project_to_the_same_project(self):
        """
        Tries changing the related project to the same project twice (which should not work or at least not lead to an
        error)
        :return:
        """
        response = self.rest_generic_create_entity(self.token1, 0)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # verify the entry exists in the database
        self.assertEquals(self.entity.objects.filter(pk=decoded_response['pk']).exists(), True)
        element = self.entity.objects.filter(pk=decoded_response['pk']).first()

        # verify that element does not have any projects set
        self.assertEquals(element.projects.all().count(), 0)

        # set parent project of entity 0 to self.project1
        response = self.rest_generic_set_project(self.token1, element.pk, [self.project1.pk])
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that element has one projects set
        self.assertEquals(element.projects.all().count(), 1)

        # set it again
        response = self.rest_generic_set_project(self.token1, element.pk, [self.project1.pk, self.project1.pk])
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that element still only has one projects set
        self.assertEquals(element.projects.all().count(), 1)

        # set it again
        response = self.rest_generic_set_project(self.token1, element.pk, [self.project1.pk, self.project1.pk, self.project1.pk])
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that element still only has one projects set
        self.assertEquals(element.projects.all().count(), 1)

    def test_change_related_project(self):
        """
        Tests various cases that could happen when changing the related project
        :return:
        """
        # create entity 0 with user1 (should work)
        response = self.rest_generic_create_entity(self.token1, 0)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # verify the entry exists in the database
        self.assertEquals(self.entity.objects.filter(pk=decoded_response['pk']).exists(), True)
        element = self.entity.objects.filter(pk=decoded_response['pk']).first()

        # verify that element does not have any projects set
        self.assertEquals(element.projects.all().count(), 0)

        # set parent project of entity 0 to self.project1
        response = self.rest_generic_set_project(self.token1, element.pk, [self.project1.pk])
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that the element has projects set
        self.assertEquals(element.projects.all().count(), 1)

        # in addition, try to set parent project of entity 0 to self.project1 and self.project2
        # this should not work, as user1 does not have access to project2
        response = self.rest_generic_set_project(self.token1, element.pk, [self.project1.pk, self.project2.pk])
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue('projects' in decoded_response)
        self.assertTrue('You can not add or remove projects that you do not have access to' in str(decoded_response['projects']))

        # verify that no new project has been added
        self.assertEquals(element.projects.all().count(), 1)

        # give user1 the observer role in project2
        response = self.rest_assign_user_to_project(self.token2, self.project2, self.user1, self.observer_role,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # now user1 can see project2, but can still not add anything to that project
        # in other words: just being able to see a project does not lead to being able to link an entity to the project
        response = self.rest_generic_set_project(self.token1, element.pk, [self.project1.pk, self.project2.pk])
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # verify that no new project has been added
        self.assertEquals(element.projects.all().count(), 1)

        # now user2 tries to set the project of element (should not work, as user2 does not have access to that)
        response = self.rest_generic_set_project(self.token2, element.pk, [self.project1.pk, self.project2.pk])
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # add user2 to project1 with observer permission, so user2 can see the element
        response = self.rest_assign_user_to_project(self.token1, self.project1, self.user2, self.observer_role,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_assignment = json.loads(response.content.decode())

        # now user2 can see the element, but should not be able to change anything of that element
        # in other words: just being able to see the element does not lead to being able to edit/update the element
        response = self.rest_generic_set_project(self.token2, element.pk, [self.project1.pk, self.project2.pk])
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # verify that there is still only one project
        self.assertEquals(element.projects.all().count(), 1)

        # now increase the role of user2 in project1 to project manager
        response = self.rest_edit_user_project_assignment(self.token1, self.project1, decoded_assignment['pk'],
                                                          self.user2, self.pm_role, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user1 needs to unlock the element
        self.rest_generic_unlock_entity(self.token1, element.pk)

        # now user2 should be able to move the element from project1 to project2 aswell
        response = self.rest_generic_set_project(self.token2, element.pk, [self.project1.pk, self.project2.pk])
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # and those two projects should now be available
        self.assertEquals(element.projects.all().count(), 2)

        # user1 can try to remove project2 again - but user1 is not a PM in project2, so it should not work
        response = self.rest_generic_set_project(self.token1, element.pk, [self.project1.pk])
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        self.assertEquals(element.projects.all().count(), 2)

        # but user2 can remove it again
        response = self.rest_generic_set_project(self.token2, element.pk, [self.project1.pk])
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        self.assertEquals(element.projects.all().count(), 1)

    def test_check_auto_created_entity_permission_is_owner(self):
        """
        Tests retrieving entity permission assignments
        :return:
        """
        response = self.rest_generic_create_entity(self.token1, 0)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # retrieve entity permissions
        response = self.rest_generic_get_privileges(self.token1, decoded_response['pk'])
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())

        # there should be one entry in the decoded_privileges
        self.assertEquals(len(decoded_privileges), 1)
        # it should have user1
        self.assertEquals(decoded_privileges[0]['user_pk'], self.user1.pk)
        self.assertEquals(decoded_privileges[0]['object_id'], decoded_response['pk'])
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_ALLOW)

    def generic_create_entity_and_return_from_db(self, token, entity_index):
        """
        Generic method for creating an entity with the provided user token and returning the element from database
        :param entity_index:
        :return:
        """
        response = self.rest_generic_create_entity(token, entity_index)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # verify the entry exists in the database
        self.assertEquals(self.entity.objects.filter(pk=decoded_response['pk']).exists(), True)
        element = self.entity.objects.filter(pk=decoded_response['pk']).first()

        return element

    def generic_create_entity_and_add_another_user(self, entity_index, additional_user):
        # create entity 0 with user1 (should work)
        response = self.rest_generic_create_entity(self.token1, 0)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # verify the entry exists in the database
        self.assertEquals(self.entity.objects.filter(pk=decoded_response['pk']).exists(), True)
        element = self.entity.objects.filter(pk=decoded_response['pk']).first()

        # try to access this entry with user1 (should work)
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to access this entity with user2 (should not work)
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # try to access this entity with user3 (should not work)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # add user2 to privileges for this element
        response = self.rest_generic_create_privilege(self.token1, element.pk, self.user2.pk)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        user2_privilege = json.loads(response.content.decode())
        # verify that all privileges for this user are set to neutral (for now)
        self.assertEquals(user2_privilege['user']['pk'], self.user2.pk)
        self.assertEquals(user2_privilege['view_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)
        self.assertEquals(user2_privilege['edit_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)
        self.assertEquals(user2_privilege['trash_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)
        self.assertEquals(user2_privilege['delete_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)
        self.assertEquals(user2_privilege['restore_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)

        # try to access this entity with user2 (should not work)
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # try to access this entity with user3 (should not work)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        return element, user2_privilege

    def test_entity_permission_view_deny(self):
        """
        Tests whether giving the view permission gives users access to the element
        :return:
        """
        element, user2_privilege = self.generic_create_entity_and_add_another_user(0, self.user2)

        # update privilege (should work): add view privilege
        user2_privilege['view_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user1 should still be able to see the element
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should see the element
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to access this entity with user3 (should still not work)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # now modify the privilege such that user2 is DENIED viewing the element
        user2_privilege['view_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_DENY
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user1 should still be able to see the element
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should not see the element
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_entity_permission_view_deny_with_project(self):
        """
        Tests whether denying the view permission for a given element that already is in a project works
        :return:
        """
        # create entity 0 with user1 (should work)
        response = self.rest_generic_create_entity(self.token1, 0)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())

        # verify the entry exists in the database
        self.assertEquals(self.entity.objects.filter(pk=decoded_response['pk']).exists(), True)
        element = self.entity.objects.filter(pk=decoded_response['pk']).first()

        # set parent project of entity 0 to self.project1
        response = self.rest_generic_set_project(self.token1, element.pk, [self.project1.pk])
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to access this entry with user1 (should work)
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to access this entity with user2 (should not work)
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # try to access this entity with user3 (should work, as user3 is in the same project)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now remove the view privilege from user3
        response = self.rest_generic_patch_privilege(self.token1, element.pk, self.user3.pk, {
            'view_privilege': ModelPrivilege.PRIVILEGE_CHOICES_DENY
        })
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # try to access this entity with user3 (should not work)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # user1 should still be able to view it
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to access this entity with user2 (should still not work)
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_entity_permission_edit_deny(self):
        """
        Tests whether giving the edit permission allows users to edit the element
        :return:
        """
        element, user2_privilege = self.generic_create_entity_and_add_another_user(0, self.user2)

        # update privilege (should work): add view privilege
        user2_privilege['view_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user1 should still be able to see the element
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # also, user1 should be able to edit the element
        response = self.rest_generic_update_entity(self.token1, element.pk, 1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should see the element
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # unlock the element with user1
        self.rest_generic_unlock_entity(self.token1, element.pk)

        # but user2 should not be able to edit the element
        response = self.rest_generic_update_entity(self.token2, element.pk, 1)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # try to access this entity with user3 (should still not work)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # update privilege (should work): add edit privilege
        user2_privilege['edit_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user1 should still be able to see the element
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should still be able to the element
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to access this entity with user3 (should still not work)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # in addition, user2 should now be able to edit the element
        response = self.rest_generic_update_entity(self.token2, element.pk, 1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # unlock the element with user2
        self.rest_generic_unlock_entity(self.token2, element.pk)

        # also, user1 should still be able to edit the element
        response = self.rest_generic_update_entity(self.token1, element.pk, 0)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # unlock the element with user1
        self.rest_generic_unlock_entity(self.token1, element.pk)

        # now deny the edit privilege for user2 (should work)
        user2_privilege['edit_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_DENY
        response = self.rest_generic_update_privilege(self.token1, element.pk, self.user2.pk, user2_privilege)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user1 should still be able to see the element
        response = self.rest_generic_get_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should still be able to see the element
        response = self.rest_generic_get_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to access this entity with user3 (should still not work)
        response = self.rest_generic_get_entity(self.token3, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # in addition, user2 should no longer be able to edit the element
        response = self.rest_generic_update_entity(self.token2, element.pk, 1)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # also, user1 should still be able to edit the element
        response = self.rest_generic_update_entity(self.token1, element.pk, 0)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_entity_create_export_link(self):
        """
        Tests creating an export link for a given entity
        Also tests downloading from that link
        :return:
        """
        element = self.generic_create_entity_and_return_from_db(self.token1, 0)

        response = self.rest_generic_get_export_link_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue("url" in decoded_response)

        # try to access this URL without a token
        self.reset_client_credentials()
        response = self.client.get(
            decoded_response['url'],
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # this url should still work
        self.reset_client_credentials()
        response = self.client.get(
            decoded_response['url'],
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_entity_export_with_invalid_link(self):
        """
        Tests creating an export link and then downloading the element with an invalid link
        :return:
        """
        element = self.generic_create_entity_and_return_from_db(self.token1, 0)

        response = self.rest_generic_get_export_link_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue("url" in decoded_response)

        url = decoded_response["url"]
        split_url = url.split("?jwt=")

        url = split_url[0] + "?jwt=" + split_url[1].replace("a", "b").replace("c", "d").replace("e", "f")
        self.reset_client_credentials()
        response = self.client.get(
            url,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_export_without_token(self):
        """
        Tries to access the export endpoint without an jwt token and without an access token in the header
        :return:
        """
        element = self.generic_create_entity_and_return_from_db(self.token1, 0)

        response = self.rest_generic_get_export_link_entity(self.token1, element.pk)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue("url" in decoded_response)

        url = decoded_response["url"]
        split_url = url.split("?jwt=")

        url = split_url[0]
        self.reset_client_credentials()
        response = self.client.get(
            url,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_export_without_view_permission(self):
        """
        Tries to generate an export link without the view permission/privilege (should not work)
        :return:
        """
        element = self.generic_create_entity_and_return_from_db(self.token1, 0)

        response = self.rest_generic_get_export_link_entity(self.token2, element.pk)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_recently_modified_by_me_with_wrong_parameters(self):
        """
        Tests the recently modified by me feature with wrong parameters (non integers)
        :return:
        """
        response = self.rest_generic_recently_modified_by_me(self.token1, "")
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.rest_generic_recently_modified_by_me(self.token1, "abc")
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.rest_generic_recently_modified_by_me(self.token1, "?")
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.rest_generic_recently_modified_by_me(self.token1, "!")
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.rest_generic_recently_modified_by_me(self.token1, "#")
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search(self):
        """
        Tests the search functionality of the endpoint, such as full text search aswell as recently modified by me
        :return:
        """
        # create two elements
        element1 = self.generic_create_entity_and_return_from_db(self.token1, 0)
        element2 = self.generic_create_entity_and_return_from_db(self.token1, 1)

        # call search endpoint
        response = self.rest_generic_search_entity(self.token1, str(element1))
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEquals(len(decoded_response), 1, msg="Search should return only one element")

        # call recently modified by me (within the last 1 days)
        response = self.rest_generic_recently_modified_by_me(self.token1, 1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEquals(len(decoded_response), 2, msg="Search should return two elements")

        # now try the same with user2 (should return 0 elements, as user2 did not modify anything)
        response = self.rest_generic_recently_modified_by_me(self.token2, 1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEquals(len(decoded_response), 0, msg="Search should return no elements")

        # reset element1 last_modified_at and created_at to 2 days ago
        with RevisionModelMixin.enabled(False):
            with disable_permission_checks(self.entity):
                # reset last modified at aswell as created at
                element1.last_modified_at = element1.last_modified_at - timedelta(days=2)
                element1.created_at = element1.created_at - timedelta(days=2)
                element1.save()
                # reset the changset date
                cs = element1.changesets.all().first()
                cs.date = element1.created_at
                cs.save()

        # unlock the element1 with user1
        self.rest_generic_unlock_entity(self.token1, element1.pk)
        # unlock the element2 with user1
        self.rest_generic_unlock_entity(self.token1, element2.pk)

        # call recently modified by me (within the last 1 days)
        response = self.rest_generic_recently_modified_by_me(self.token1, 1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEquals(len(decoded_response), 1, msg="Search should return one element; probably missing recently_modified_by_me = RecentlyModifiedByMeFilter()?")

        # call recently modified by me (within the last 2 days)
        response = self.rest_generic_recently_modified_by_me(self.token1, 2)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEquals(len(decoded_response), 2, msg="Search should return two elements")

        # now try the same with user2 (should return 0 elements, as user2 did not modify anything)
        response = self.rest_generic_recently_modified_by_me(self.token2, 1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEquals(len(decoded_response), 0, msg="Search should return no elements")

        # give user2 view and edit privilege for element2
        response = self.rest_generic_create_privilege(self.token1, element2.pk, self.user2.pk)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        self.rest_generic_patch_privilege(self.token1, element2.pk, self.user2.pk, {
            'view_privilege': ModelPrivilege.PRIVILEGE_CHOICES_ALLOW,
            'edit_privilege': ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        })

        # modify element2 with user2
        response = self.rest_generic_update_entity(self.token2, element2.pk, 0)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should see element2 in recently modified
        response = self.rest_generic_recently_modified_by_me(self.token2, 1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEquals(len(decoded_response), 1, msg="Search should return one element")

        # and user1 should also still see two elements (within 2 days)
        response = self.rest_generic_recently_modified_by_me(self.token1, 2)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEquals(len(decoded_response), 2, msg="Search should return two elements")
