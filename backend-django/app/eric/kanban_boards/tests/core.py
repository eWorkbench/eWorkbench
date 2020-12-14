#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.status import HTTP_201_CREATED, HTTP_200_OK

from eric.core.tests import custom_json_handler


class KanbanBoardMixin:
    """
    Mixin which provides several wrapper methods for the /api/kanbanboards/ endpoint
    """

    def rest_get_kanbanboard_export_link(self, auth_token, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a kanban_board
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/kanbanboards/{}/get_export_link/'.format(kanban_board_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_kanbanboards(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the kanban board endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/kanbanboards/?search={}'.format(search_string),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_kanbanboards_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the kanban board endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/kanbanboards/?recently_modified_by_me={}'.format(number_of_days),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_kanbanboard(self, auth_token, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a kanban_board by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/kanbanboards/{}/'.format(kanban_board_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_kanbanboards(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of kanban_boards that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/kanbanboards/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_kanbanboards_for_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a list of kanban_boards for a specific project via REST API (using filter
        ?project={project_pk}) """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/kanbanboards/', {'project': project_pk},
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_kanbanboard(self, auth_token, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for deleting a kanban_board via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/kanbanboards/{pk}/'.format(pk=kanban_board_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_kanbanboard(self, auth_token, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for restoring a kanban_board via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/kanbanboards/{pk}/restore/'.format(pk=kanban_board_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_kanbanboard(self, auth_token, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for trashing a kanban_board via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/kanbanboards/{pk}/soft_delete/'.format(pk=kanban_board_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_kanbanboard(self, auth_token, kanban_board_pk, project_pks, title, board_type, HTTP_USER_AGENT,
                                REMOTE_ADDR, kanban_board_columns=None):
        """ Wrapper for updateing a kanban_board via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "title": title,
            "board_type": board_type,
        }

        if kanban_board_columns:
            data['kanban_board_columns'] = kanban_board_columns

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.put(
            '/api/kanbanboards/{}/'.format(kanban_board_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_kanbanboard_project(self, auth_token, kanban_board_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a kanban_board
        :param auth_token:
        :param kanban_board_pk:
        :param project_pks: list
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return: response
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            'projects': project_pks
        }

        return self.client.patch(
            '/api/kanbanboards/{}/'.format(kanban_board_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_kanbanboard_child_elements(self, auth_token, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT,
                                               REMOTE_ADDR):
        """
        Wrapper for updating child elements of a kanban_board via REST API (with a PATCH call)
        :param auth_token:
        :param kanban_board_pk:
        :param child_elements:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            'kanban_board_columns': kanban_board_columns,
        }

        return self.client.patch(
            '/api/kanbanboards/{}/'.format(kanban_board_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_create_kanbanboard(self, auth_token, project_pks,
                                title, board_type,
                                HTTP_USER_AGENT, REMOTE_ADDR, kanban_board_columns=None):
        """ Wrapper for creating a kanban board via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "title": title,
            "board_type": board_type,
        }

        if kanban_board_columns:
            data['kanban_board_columns'] = kanban_board_columns

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.post(
            '/api/kanbanboards/'.format(),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_tasks_of_kanbanboard(self, auth_token, kanban_board_pk,
                                      HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for adding a task into a kanban board column """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/kanbanboards/%(kanban_board_pk)s/tasks/' % {'kanban_board_pk': kanban_board_pk},
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_kanbanboards_and_columns_of_task(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for retrieving all kanban boards/columns of a given task """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/tasks/%(task_pk)s/kanbanboard_assignments/' % {'task_pk': task_pk},
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_add_task_to_kanbanboard_column(self, auth_token, kanban_board_pk, kanban_board_column_pk, task_pk,
                                            HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for adding a task into a kanban board column """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "kanban_board_column": kanban_board_column_pk,
            "task_id": task_pk,
        }
        return self.client.post(
            '/api/kanbanboards/%(kanban_board_pk)s/tasks/' % {'kanban_board_pk': kanban_board_pk},
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_add_tasks_to_kanbanboard_column(self, auth_token, kanban_board_pk, data,
                                             HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for adding more than one task into a kanban board column """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.post(
            '/api/kanbanboards/%(kanban_board_pk)s/tasks/create_many/' % {'kanban_board_pk': kanban_board_pk},
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_move_tasks_between_kanbanboard_columns(self, auth_token, kanban_board_pk, data,
                                                    HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for adding more than one task into a kanban board column """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.put(
            '/api/kanbanboards/%(kanban_board_pk)s/tasks/move_assignment/' % {'kanban_board_pk': kanban_board_pk},
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_task_from_kanbanboard(self, auth_token, kanban_board_pk, task_assignment_pk,
                                          HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for deleting a task from the kanban board """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/kanbanboards/%(kanban_board_pk)s/tasks/%(task_assignment_pk)s/'
            % {'kanban_board_pk': kanban_board_pk, 'task_assignment_pk': task_assignment_pk},
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )


class KanbanBoardClient:
    """
    Simple REST proxy for Kanban boards.
    Takes care of HTTP authentication, response success validation and response decoding.
    """
    http_user_agent = None
    remote_address = None
    client = None
    auth_token = None
    asserter = None

    def __init__(self, client, http_user_agent, remote_address, asserter):
        """
        :param asserter Used to check response success (asserter.assertEquals())
        """
        self.client = client
        self.http_user_agent = http_user_agent
        self.remote_address = remote_address
        self.asserter = asserter

    def with_auth_token(self, token):
        self.auth_token = token
        return self

    def post(self, data):
        self.__set_credentials()

        response = self.client.post(
            '/api/kanbanboards/',
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=self.http_user_agent, REMOTE_ADDR=self.remote_address
        )

        return self.__validate_response(response, HTTP_201_CREATED)

    def patch(self, pk, data):
        self.__set_credentials()

        response = self.client.patch(
            path='/api/kanbanboards/%s/' % pk,
            data=json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=self.http_user_agent, REMOTE_ADDR=self.remote_address
        )

        return self.__validate_response(response, HTTP_200_OK)

    def update_background_image(self, pk, image_bytes, content_type="image/jpeg"):
        self.__set_credentials()

        response = self.client.patch(
            path='/api/kanbanboards/{}/'.format(pk),
            data={
                'background_image': SimpleUploadedFile(
                    "test.jpg", image_bytes, content_type=content_type)
            },
            HTTP_USER_AGENT=self.http_user_agent, REMOTE_ADDR=self.remote_address
        )

        return self.__validate_response(response, HTTP_200_OK)

    def __set_credentials(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.auth_token)

    def __validate_response(self, response, http_code):
        content = response.content.decode()
        self.asserter.assertEquals(response.status_code, http_code, content)
        return json.loads(content)
