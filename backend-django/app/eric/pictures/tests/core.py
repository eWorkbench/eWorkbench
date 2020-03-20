#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import json
import tempfile

from rest_framework import status

from eric.core.tests import custom_json_handler
from eric.projects.tests.core import TestLockMixin
from eric.pictures.models import Picture


class PictureMixin(TestLockMixin):
    """
    Mixin which provides several wrapper methods for the /api/pictures/ endpoint
    """
    def rest_get_picture_export_link(self, auth_token, picture_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a picture
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/pictures/{}/get_export_link/'.format(picture_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_pictures(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the picture endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/pictures/?search={}'.format(search_string),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_pictures_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the picture endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/pictures/?recently_modified_by_me={}'.format(number_of_days),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_picture(self, auth_token, picture_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a picture by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/pictures/{}/'.format(picture_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_pictures(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of pictures that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/pictures/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_pictures_for_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for getting a list of pictures for a specific project via REST API (using filter
        ?project={project_pk}) """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/pictures/', {'project': project_pk},
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_picture(self, auth_token, picture_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for deleting a picture via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.delete(
            '/api/pictures/{pk}/'.format(pk=picture_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_picture(self, auth_token, picture_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for restoring a picture via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/pictures/{pk}/restore/'.format(pk=picture_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_picture(self, auth_token, picture_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for trashing a picture via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.patch(
            '/api/pictures/{pk}/soft_delete/'.format(pk=picture_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_picture(self, auth_token, picture_pk, project_pks, title, background_img_file_name,
                            HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for updateing a picture via REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # open background image and post it to the rest api
        fp = open(os.path.join(
            os.path.dirname(__file__),
            "demo_pictures",
            background_img_file_name
        ), 'rb')

        data = {
            "title": title,
            "background_image": fp
        }

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.put(
            '/api/pictures/{}/'.format(picture_pk),
            data,
            format='multipart',  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_picture_shape_file(self, auth_token, picture_pk, shape_file_name, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating a pictures shape file
        :param auth_token:
        :param picture_pk:
        :param shape_file_name:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # open background image and post it to the rest api
        fp = open(os.path.join(
            os.path.dirname(__file__),
            "demo_pictures",
            shape_file_name
        ), 'rb')

        data = {
            "shapes_image": fp
        }

        return self.client.patch(
            '/api/pictures/{}/'.format(picture_pk),
            data,
            format='multipart',  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_picture_background_image_file(self, auth_token, picture_pk, background_image_file_name, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating a pictures background image file
        :param auth_token:
        :param picture_pk:
        :param background_image_file_name:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # open background image and post it to the rest api
        fp = open(os.path.join(
            os.path.dirname(__file__),
            "demo_pictures",
            background_image_file_name
        ), 'rb')

        data = {
            "background_image": fp
        }

        return self.client.patch(
            '/api/pictures/{}/'.format(picture_pk),
            data,
            format='multipart',  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_picture_rendered_image_file(self, auth_token, picture_pk, rendered_image_file_name, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating a pictures rendered image file
        :param auth_token:
        :param picture_pk:
        :param rendered_image_file_name:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # open background image and post it to the rest api
        fp = open(os.path.join(
            os.path.dirname(__file__),
            "demo_pictures",
            rendered_image_file_name
        ), 'rb')

        data = {
            "rendered_image": fp
        }

        return self.client.patch(
            '/api/pictures/{}/'.format(picture_pk),
            data,
            format='multipart',  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_picture_project(self, auth_token, picture_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a picture
        :param auth_token:
        :param picture_pk:
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
            '/api/pictures/{}/'.format(picture_pk),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_create_picture(self, auth_token, project_pks, title,
                            background_img_file_name,
                            HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for creating a picture via REST API and uploading a background image """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # open background image and post it to the rest api
        fp = open(os.path.join(
            os.path.dirname(__file__),
            "demo_pictures",
            background_img_file_name
        ), 'rb')

        data = {
            "title": title,
            "background_image": fp
        }

        if project_pks:
            if isinstance(project_pks, list):
                data['projects'] = project_pks
            else:
                data['projects'] = [project_pks]

        return self.client.post(
            '/api/pictures/'.format(),
            data,
            format='multipart',  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def create_picture_orm(self, auth_token, project_pk,
                           title, background_img_file_name,
                           HTTP_USER_AGENT, REMOTE_ADDR):
        """ Wrapper for rest_create_picture which also returns a Picture Object from Djangos ORM """

        response = self.rest_create_picture(auth_token, project_pk,
                                            title, background_img_file_name,
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return Picture.objects.get(pk=decoded['pk']), response
        else:
            return None, response
