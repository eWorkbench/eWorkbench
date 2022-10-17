#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth.models import Group, User

from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED

from eric.model_privileges.models import ModelPrivilege
from eric.projects.models import Role
from eric.versions.tests import HTTP_USER_AGENT, REMOTE_ADDRESS, USER_GROUP_NAME


class HelperMixin:
    """Provides helper methods."""

    def set_model_privilege_for_user(
        self,
        token,
        endpoint,
        pk,
        user,
        full_access_privilege=ModelPrivilege.NEUTRAL,
        view_privilege=ModelPrivilege.NEUTRAL,
        edit_privilege=ModelPrivilege.NEUTRAL,
        delete_privilege=ModelPrivilege.NEUTRAL,
        trash_privilege=ModelPrivilege.NEUTRAL,
        restore_privilege=ModelPrivilege.NEUTRAL,
    ):
        response = self.rest_create_privilege(
            auth_token=token,
            model=endpoint,
            pk=pk,
            user_pk=user.pk,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDRESS,
        )
        self.assertEqual(
            response.status_code,
            HTTP_201_CREATED,
            f"Couldn't create model privilege for model {endpoint} pk {pk} for user {user.username}",
        )

        privilege = json.loads(response.content.decode())

        privilege.update(
            {
                "full_access_privilege": full_access_privilege,
                "view_privilege": view_privilege,
                "edit_privilege": edit_privilege,
                "delete_privilege": delete_privilege,
                "trash_privilege": trash_privilege,
                "restore_privilege": restore_privilege,
            }
        )

        response = self.rest_update_privilege(
            auth_token=token,
            model=endpoint,
            pk=pk,
            user_pk=user.pk,
            privilege=privilege,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDRESS,
        )
        self.assertEqual(response.status_code, HTTP_200_OK, "Couldn't set model privilege for user %s" % user.username)

    def assign_user_to_project(self, token, user, project):
        default_user_role = Role.objects.filter(default_role_on_project_user_assign=True).first()
        response = self.rest_assign_user_to_project(
            token, project, user, default_user_role, HTTP_USER_AGENT, REMOTE_ADDRESS
        )
        self.assertEqual(HTTP_201_CREATED, response.status_code, "Couldn't assign user to project")

    def remove_user_from_project(self, token, user, project):
        response = self.rest_get_user_project_assignment(token, project.pk, user.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)
        self.assertEqual(HTTP_200_OK, response.status_code, "Couldn't get user-project assignment")

        assignment = response.content.decode()
        assignment_pk = assignment["pk"]

        response = self.rest_delete_user_from_project(token, project.pk, assignment_pk, HTTP_USER_AGENT, REMOTE_ADDRESS)
        self.assertEqual(HTTP_200_OK, response.status_code, "Couldn't remove user from project")

    def create_user_and_login(self, username, is_superuser=False):
        password = "password"
        user_group = Group.objects.get(name=USER_GROUP_NAME)
        user = User.objects.create_user(
            username=username, email="%s@email.com" % username, password=password, is_superuser=is_superuser
        )
        user.groups.add(user_group)
        token = self.login_and_return_token(username, password, HTTP_USER_AGENT, REMOTE_ADDRESS)
        return user, token
