#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework import status

from eric.core.tests import custom_json_handler
from eric.drives.models import Drive


class DriveMixin:
    """
    Mixin which provides several wrapper methods for the /api/drives/ endpoint
    """

    def rest_get_drive_export_link(self, auth_token, drive_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a drive
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/drives/{}/get_export_link/'.format(drive_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_drives(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the drives endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/drives/?search={}'.format(search_string),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_drives_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the drives endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/drives/?recently_modified_by_me={}'.format(number_of_days),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_drive(self, auth_token, drive_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a drive by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/drives/{}/'.format(drive_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_drives(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of drives that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/drives/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_drive_elements(self, auth_token, drive_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of drive elements that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/drives/{drive_pk}/elements/'.format(drive_pk=drive_pk),
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_drives_for_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a list of drives for a specific project via REST API (using filter
        ?project={project_pk}) """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/drives/', {'project': project_pk},
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_drive(self, auth_token, drive_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for deleting a drive via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/drives/{pk}/'.format(pk=drive_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_drive(self, auth_token, drive_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for restoring a drive via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/drives/{pk}/restore/'.format(pk=drive_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_drive(self, auth_token, drive_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for trashing a drive via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/drives/{pk}/soft_delete/'.format(pk=drive_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_drive(self, auth_token, drive_pk, project_pks, title, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for updateing a drive via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "title": title,
        }

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.put(
            '/api/drives/{}/'.format(drive_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_drive_project(self, auth_token, drive_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a drive
        :param auth_token:
        :param drive_pk:
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
            '/api/drives/{}/'.format(drive_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_drive_get_directories(self, auth_token, drive_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for retrieving a list of directories of a drive
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/drives/{drive_pk}/sub_directories/'.format(drive_pk=drive_pk),
            None,
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_drive_get_files(self, auth_token, drive_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for retrieving all files of a given dirve
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/files/?drive={drive_pk}'.format(drive_pk=drive_pk),
            None,
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_drive_create_directory(self, auth_token, drive_pk, name, parent_directory_pk,
                                    HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for creating a directory within a drive
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "name": name,
        }

        if parent_directory_pk:
            data['directory'] = parent_directory_pk

        return self.client.post(
            '/api/drives/{drive_pk}/sub_directories/'.format(drive_pk=drive_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_drive_create_dss_directory(self, auth_token, drive_pk, name, parent_directory_pk, imported,
                                        HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for creating a directory within a drive
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "name": name,
            "imported": imported,
        }

        if parent_directory_pk:
            data['directory'] = parent_directory_pk

        return self.client.post(
            '/api/drives/{drive_pk}/sub_directories/'.format(drive_pk=drive_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_drive_update_directory(self, auth_token, drive_pk, directory_pk, name, parent_directory_pk,
                                    HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating a directory within a drive
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "name": name,
        }

        if parent_directory_pk:
            data['directory'] = parent_directory_pk

        return self.client.put(
            f'/api/drives/{drive_pk}/sub_directories/{directory_pk}/',
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_drive_delete_directory(self, auth_token, drive_pk, directory_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for deleting a directory within a drive
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            f'/api/drives/{drive_pk}/sub_directories/{directory_pk}/',
            None,
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_drive_download_directory(self, auth_token, drive_pk, directory_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for downloading a directory within a drive
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            f'/api/drives/{drive_pk}/sub_directories/{directory_pk}/download/',
            None,
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_create_drive(self, auth_token, project_pks,
                          title,
                          HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for creating a file via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "title": title,
        }

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.post(
            '/api/drives/',
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def create_drive_orm(self, auth_token, project_pk,
                         title,
                         HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for rest_create_drive which also returns a Drive Object from Djangos ORM """

        response = self.rest_create_drive(auth_token, project_pk,
                                          title,
                                          HTTP_USER_AGENT, REMOTE_ADDR)
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return Drive.objects.get(pk=decoded['pk']), response
        else:
            return None, response

    def rest_create_dss_drive(self, auth_token, project_pks,
                              title,
                              dss_envelope_id,
                              imported,
                              HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for creating a dss drive via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "title": title,
            "dss_envelope_id": dss_envelope_id,
            "imported": imported,
        }

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.post(
            '/api/drives/'.format(),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def create_dss_drive_orm(self, auth_token, project_pk,
                             title,
                             dss_envelope_id,
                             imported,
                             HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for rest_create_dss_drive which also returns a Drive Object from Djangos ORM """

        response = self.rest_create_dss_drive(auth_token, project_pk,
                                              title,
                                              dss_envelope_id,
                                              imported,
                                              HTTP_USER_AGENT, REMOTE_ADDR)
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return Drive.objects.get(pk=decoded['pk']), response
        else:
            return None, response

    def rest_update_dss_drive(self, auth_token, drive_pk, project_pks, title,
                              dss_envelope_id, imported, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for updateing a dss drive via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        data = {
            "title": title,
            "dss_envelope_id": dss_envelope_id,
            "imported": imported,
        }

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.put(
            '/api/drives/{}/'.format(drive_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
