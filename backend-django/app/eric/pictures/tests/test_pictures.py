#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import os

from django.urls import reverse
from django.utils.timezone import datetime, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from eric.pictures.models import Picture
from eric.pictures.tests.core import PictureMixin
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class TestGenericsPictures(APITestCase, EntityChangeRelatedProjectTestMixin, PictureMixin):
    entity = Picture

    def setUp(self):
        self.superSetUp()

        self.data = [
            {"title": "Captains Log", "background_img_file_name": "demo1.png", "project_pks": None},
            {
                "title": "Experiment 1",
                "background_img_file_name": "demo2.png",
                "project_pks": None,
            },
        ]

    def test_upload_rendered_image(self):
        """
        Creates a new picture and changes the rendered image
        :return:
        """
        picture, response = self.create_picture_orm(
            self.token1,
            None,
            "Beautiful Picture",
            "demo1.png",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        # try to update the picture: upload new shapes file
        response = self.rest_update_picture_rendered_image_file(
            self.token1, str(picture.pk), "demo1.png", HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_upload_shapes(self):
        """
        Creates a new picture and changes the shapes of a picture
        :return:
        """
        picture, response = self.create_picture_orm(
            self.token1,
            None,
            "Beautiful Picture",
            "demo1.png",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        # try to update the picture: upload new shapes file
        response = self.rest_update_picture_shape_file(
            self.token1, str(picture.pk), "demo1.json", HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_upload_invalid_shapes(self):
        """
        Creates a new picture and tries to upload an invalid shape file (one that does not contain valid json)
        :return:
        """
        picture, response = self.create_picture_orm(
            self.token1,
            None,
            "Beautiful Picture",
            "demo1.png",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        # try to update the picture: upload an invalid shapes file
        response = self.rest_update_picture_shape_file(
            self.token1, str(picture.pk), "invalid.json", HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # try to update the picture: upload a png file instead of a shape file
        response = self.rest_update_picture_shape_file(
            self.token1, str(picture.pk), "demo1.png", HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_download_picture(self):
        """
        Tests that the download of a picture and associated files is denied if the user does not have the appropriate
        view permission
        :return:
        """
        # create a picture, upload shapes and rendered image
        picture, response = self.create_picture_orm(
            self.token1,
            None,
            "Beautiful Picture",
            "demo1.png",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        # try to update the picture: upload new shapes file
        response = self.rest_update_picture_shape_file(
            self.token1, str(picture.pk), "demo1.json", HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to update the picture: upload new shapes file
        response = self.rest_update_picture_rendered_image_file(
            self.token1, str(picture.pk), "demo2.png", HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # decode response so we get the actual REST API JSON response, which contains the download URLs
        decoded_response = json.loads(response.content.decode())

        # refresh picture
        picture.refresh_from_db()

        # now try to download it with user1 (should work)
        # download shapes
        response = self.client.get(decoded_response["download_shapes"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # reset login token for background image and rendered image (they use a JWT token)
        self.client.credentials()

        # background image
        response = self.client.get(decoded_response["download_background_image"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # rendered image
        response = self.client.get(decoded_response["download_rendered_image"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to generate the rendered image url using djangos reverse function
        bg_img_url = reverse("picture-background-image", kwargs={"pk": picture.uploaded_picture_entry.pk})
        rendered_img_url = reverse("picture-rendered-image", kwargs={"pk": picture.uploaded_picture_entry.pk})

        # try to access those urls without token (should not work -> 401)
        response = self.client.get(bg_img_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response = self.client.get(rendered_img_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # also, accessing the shapes without token (should not work -> 401)
        response = self.client.get(decoded_response["download_shapes"])
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # try to retrieve the picture meta data with user2 (should not work)
        response = self.rest_get_picture(self.token2, picture.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # now that we are logged in as user2, try to retrieve background image, rendered image, and shapes file
        response = self.client.get(bg_img_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        response = self.client.get(rendered_img_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # also, accessing the shapes without token (should not work -> 404)
        response = self.client.get(decoded_response["download_shapes"])
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_on_delete_picture_also_delete_the_physical_files(self):
        """
        Tries to delete a picture, which should also delete the physical representation of the picture
        :return:
        """
        # create a picture, upload shapes and rendered image
        picture, response = self.create_picture_orm(
            self.token1,
            None,
            "Beautiful Picture",
            "demo1.png",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        # try to update the picture: upload new shapes file
        response = self.rest_update_picture_shape_file(
            self.token1, str(picture.pk), "demo1.json", HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to update the picture: upload new background image file
        response = self.rest_update_picture_rendered_image_file(
            self.token1, str(picture.pk), "demo2.png", HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        picture.refresh_from_db()

        # the files should exist on system
        self.assertTrue(os.path.exists(picture.rendered_image.path), msg="Rendered Image should exist on disk")
        self.assertTrue(os.path.exists(picture.background_image.path), msg="Background Image should exist on disk")
        self.assertTrue(os.path.exists(picture.shapes_image.path), msg="Shapes JSON should exist on disk")

        # trash and delete the picture
        response = self.rest_trash_picture(self.token1, picture.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.rest_delete_picture(self.superuser_token, picture.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # now the files should not exist anymore
        self.assertFalse(os.path.exists(picture.rendered_image.path), msg="Rendered Image should exist on disk")
        self.assertFalse(os.path.exists(picture.background_image.path), msg="Background Image should exist on disk")
        self.assertFalse(os.path.exists(picture.shapes_image.path), msg="Shapes JSON should exist on disk")
