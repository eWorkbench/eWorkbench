#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

import os
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.http import HttpResponse, FileResponse, QueryDict
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.pictures.models import Picture, UploadedPictureEntry
from eric.pictures.rest.filters import PictureFilter
from eric.pictures.rest.serializers import PictureSerializer
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn


def has_string(data, key):
    """ Checks if the given key in the data dictionary is present and a string """
    return key in data and isinstance(data[key], str)


def has_strings(data, *keys):
    """ Checks if the given keys in the data dictionary are present and strings """
    for key in keys:
        if not has_string(data, key):
            return False

    return True


class PictureViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ REST API Viewset for notes """
    serializer_class = PictureSerializer
    filterset_class = PictureFilter
    search_fields = ()

    ordering_fields = ('title', 'created_at', 'created_by', 'last_modified_at', 'last_modified_by', 'height', 'width')

    def create(self, request, *args, **kwargs):
        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request.data._mutable = True

        # allow duplicating a picture via the "shapes" and "background_image" attribute
        # therefore we need to check if shapes and background_image are set to a string (rather than a file)
        if has_strings(request.data, 'shapes_image', 'background_image', 'rendered_image'):

            # check that shapes is a uuid
            pk = uuid.UUID(request.data['shapes_image'], version=4)

            # check that the existing picture pk is viewable by the current user
            picture = Picture.objects.viewable().get(pk=pk)

            if picture.shapes_image:
                # fake the upload picture by using the existing Picture
                request.data['shapes_image'] = UploadedFile(
                    file=picture.shapes_image.file,
                    name=picture.shapes_image.name,
                    size=picture.shapes_image.file.size,
                    content_type="application/json"
                )
            else:
                del request.data['shapes_image']

            request.data['background_image'] = UploadedFile(
                file=picture.background_image.file,
                name=picture.background_image.name,
                size=picture.background_image.file.size,
                content_type="image"
            )

            if picture.rendered_image:
                request.data['rendered_image'] = UploadedFile(
                    file=picture.rendered_image.file,
                    name=picture.rendered_image.name,
                    size=picture.rendered_image.file.size,
                    content_type="image/png"
                )
            else:
                del request.data['rendered_image']

        return super(PictureViewSet, self).create(request, *args, **kwargs)

    def get_queryset(self):
        """
        returns the queryset for Picture viewable objects,
        filtered by project primary (optional)
        """
        return Picture.objects.viewable().prefetch_common().prefetch_related('projects')

    @action(detail=True, methods=['GET'], url_path='shapes.json', url_name='shapes-json')
    def download_shapes_json(self, request, format=None, *args, **kwargs):
        """ Provides a detail route endpoint for downloading the shapes json """
        uploaded_picture_entry = self.get_picture_entry(**kwargs)
        return self.build_download_response(
            "shapes.json",
            uploaded_picture_entry.shapes_image
        )

    @action(detail=True, methods=['GET'], url_path='background_image.png', url_name='background-image')
    def download_background_image(self, request, format=None, *args, **kwargs):
        """ Provides a detail route endpoint for downloading the background image """
        uploaded_picture_entry = self.get_picture_entry(**kwargs)

        # take background image from uploaded_picture_entry, if it exists
        # there is some invalid/missing data on the live system,
        # therefore we need to use the image from the picture element itself as fallback
        image = uploaded_picture_entry.background_image
        if not uploaded_picture_entry.background_image:
            image = uploaded_picture_entry.picture.background_image

        return self.build_download_response(
            "background_image.png",
            image
        )

    @action(detail=True, methods=['GET'], url_path='rendered_image.png', url_name='rendered-image')
    def download_rendered_image(self, request, format=None, *args, **kwargs):
        """ Provides a detail route endpoint for downloading the rendered image """
        uploaded_picture_entry = self.get_picture_entry(**kwargs)
        return self.build_download_response(
            "rendered_image.png",
            uploaded_picture_entry.rendered_image
        )

    @staticmethod
    def get_picture_entry(**kwargs):
        pk = kwargs.get('pk')
        entry = UploadedPictureEntry.objects.filter(pk=pk).select_related('picture').first()

        # HTTP 404 if the user is not allowed to access the picture
        if not entry.picture.is_viewable():
            raise NotFound

        return entry

    @staticmethod
    def build_download_response(download_file_name, image):
        if image:
            file_path = os.path.join(settings.MEDIA_ROOT, image.name)
            response = FileResponse(open(file_path, 'rb'))
            response['Content-Type'] = 'image/png;'
        else:
            response = HttpResponse("[]")
            response['Content-Type'] = 'application/json;'

        response['Content-Disposition'] = 'attachment; filename="{}"'.format(download_file_name)

        return response
