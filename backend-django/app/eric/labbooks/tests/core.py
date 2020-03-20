#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework import status

from eric.core.tests import custom_json_handler
from eric.labbooks.models import LabBook, LabbookSection
from eric.projects.tests.core import TestLockMixin


def set_projects(data, pk_or_list):
    if pk_or_list:
        data['projects'] = get_pk_list(pk_or_list)


def get_pk_list(pk_or_list):
    return pk_or_list if isinstance(pk_or_list, list) else [pk_or_list]


class LabBookMixin:
    """
    Mixin which provides several wrapper methods for the /api/labbooks/ endpoint
    """
    def rest_get_labbook_export_link(self, auth_token, labbook_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a labbook
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooks/{}/get_export_link/'.format(labbook_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_labbooks(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the labbooks endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooks/?search={}'.format(search_string),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_labbooks_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the labbooks endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooks/?recently_modified_by_me={}'.format(number_of_days),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_labbook(self, auth_token, labbook_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a labbook by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooks/{}/'.format(labbook_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_labbooks(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of labbooks that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooks/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_labbook_elements(self, auth_token, labbook_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of labbook elements that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooks/{labbook_pk}/elements/'.format(labbook_pk=labbook_pk),
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_labbook_elements_for_section(self, auth_token, labbook_pk, section_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of labbook elements that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooks/{labbook_pk}/elements/?section={section_pk}'.format(labbook_pk=labbook_pk,
                                                                              section_pk=section_pk),
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_add_labbook_element(self, auth_token, labbook_pk,
                                 child_object_content_type, child_object_id, position_x, position_y, width, height,
                                 HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for adding a new element to labbook elements
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            'child_object_content_type': child_object_content_type,
            'child_object_id': child_object_id,
            'position_x': position_x,
            'position_y': position_y,
            'width': width,
            'height': height
        }

        return self.client.post(
            '/api/labbooks/{labbook_pk}/elements/'.format(labbook_pk=labbook_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_remove_labbook_element(self, auth_token, labbook_pk, element_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for removing a labbook element
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/labbooks/{labbook_pk}/elements/{element_pk}/'.format(labbook_pk=labbook_pk, element_pk=element_pk),
            None,
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_labbooks_for_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a list of labbooks for a specific project via REST API (using filter
        ?project={project_pk}) """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooks/', {'project': project_pk},
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_labbook(self, auth_token, labbook_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for deleting a labbook via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/labbooks/{pk}/'.format(pk=labbook_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_labbook(self, auth_token, labbook_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for restoring a labbook via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/labbooks/{pk}/restore/'.format(pk=labbook_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_labbook(self, auth_token, labbook_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for trashing a labbook via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/labbooks/{pk}/soft_delete/'.format(pk=labbook_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_labbook(self, auth_token, labbook_pk, project_pks, title, is_template, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for updateing a labbook via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "title": title,
            "is_template": is_template
        }

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.put(
            '/api/labbooks/{}/'.format(labbook_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_labbook_project(self, auth_token, labbook_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a labbook
        :param auth_token:
        :param labbook_pk:
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
            '/api/labbooks/{}/'.format(labbook_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_create_labbook(self, auth_token, project_pks,
                            title, is_template,
                            HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for creating a file via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "title": title,
            "is_template": is_template
        }

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.post(
            '/api/labbooks/'.format(),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def create_labbook_orm(self, auth_token, project_pk,
                           title, is_template,
                           HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for rest_create_labbook which also returns a LabBook Object from Djangos ORM """

        response = self.rest_create_labbook(auth_token, project_pk,
                                            title, is_template,
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return LabBook.objects.get(pk=decoded['pk']), response
        else:
            return None, response


class LabbookSectionMixin(TestLockMixin):
    """
    Mixin which provides several wrapper methods for the /api/labbooksections endpoint
    """
    def rest_get_labbooksection(self, auth_token, labbooksection_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a labbooksection by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooksections/{}/'.format(labbooksection_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_labbooksections(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of labbooksections that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/labbooksections/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_labbooksection(self, auth_token, labbooksection_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for deleting a labbooksection via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/labbooksections/{pk}/'.format(pk=labbooksection_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_labbooksection(self, auth_token, labbooksection_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for restoring a labbooksection via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/labbooksections/{pk}/restore/'.format(pk=labbooksection_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_labbooksection(self, auth_token, labbooksection_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for trashing a labbooksection via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/labbooksections/{pk}/soft_delete/'.format(pk=labbooksection_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_labbooksection(self, auth_token, labbooksection_pk, project_pks, date, title, child_elements, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for creating a file via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "date": date,
            "title": title,
            "child_elements": child_elements,
        }

        set_projects(data, project_pks)

        return self.client.put(
            '/api/labbooksections/{}/'.format(labbooksection_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_labbooksection_project(self, auth_token, labbooksection_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a labbooksection
        :param auth_token:
        :param labbooksection_pk:
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
            '/api/labbooksections/{}/'.format(labbooksection_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_create_labbooksection(self, auth_token, project_pks,
                         date, title, child_elements,
                         HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for creating a file via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "date": date,
            "title": title,
            "child_elements": child_elements,
        }

        set_projects(data, project_pks)

        return self.client.post(
            '/api/labbooksections/'.format(),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def create_labbooksection_orm(self, auth_token, project_pk,
                        date, title, child_elements,
                        HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for rest_create_labbooksection which also returns a Task Object from Djangos ORM """

        response = self.rest_create_labbooksection(auth_token, project_pk,
                                         date, title, child_elements,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return LabbookSection.objects.get(pk=decoded['pk']), response
        else:
            return None, response
