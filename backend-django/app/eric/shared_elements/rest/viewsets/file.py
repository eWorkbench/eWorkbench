#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import uuid

from django.core.files.uploadedfile import UploadedFile
from django.http import FileResponse, QueryDict
from django.utils.translation import gettext_lazy as _
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, APIException

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.core.utils import rfc5987_content_disposition
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn
from eric.shared_elements.models import File, UploadedFileEntry
from eric.shared_elements.rest.filters import FileFilter
from eric.shared_elements.rest.serializers import FileSerializer

logger = logging.getLogger('eric.shared_elements.rest.viewsets.file')


class FileCannotBeDeletedException(APIException):
    status_code = 503
    default_detail = {
        'file_cannot_be_deleted_error': _('This file cannot be deleted at the moment, please try again later.')}
    default_code = 'service_unavailable'


class FileViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ REST API Viewset for files with a download endpoint """
    serializer_class = FileSerializer
    filterset_class = FileFilter
    search_fields = ()

    ordering_fields = ('title', 'name', 'file_size', 'created_at', 'created_by')

    def create(self, request, *args, **kwargs):
        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            request.data._mutable = True

        # allow duplicating a file via the "path" attribute
        # therefore we need to check if path is set to a string (rather than a file)
        if 'path' in request.data and isinstance(request.data['path'], str):
            # check that path is a uuid
            pk = uuid.UUID(request.data['path'], version=4)

            # check that the existing file pk is viewable by the current user
            file = File.objects.viewable().filter(pk=pk).first()

            if not file:
                # file not found (or not viewable)
                from rest_framework.exceptions import NotFound
                raise NotFound

            # fake the upload file by using the existing file
            request.data['path'] = UploadedFile(
                file=file.path.file,
                name=file.original_filename,
                size=file.file_size,
                content_type=file.mime_type
            )

        if 'title' not in request.data:
            request.data['title'] = request.data.get('name', 'New File')

        return super(FileViewSet, self).create(request, *args, **kwargs)

    def get_queryset(self):
        """
        returns the queryset for viewable Files with the first changeset (insert changeset - used to enhance
        performance when querying created_by and created_at)
        """
        return File.objects.viewable().prefetch_common().prefetch_related(
            'projects',
        )

    @action(detail=True, methods=['GET'], url_path='download', url_name='download')
    def download(self, request, format=None, *args, **kwargs):
        """ Provides a detail route endpoint for the File Download """

        file_entry = self.get_file_entry(**kwargs)

        # create a file response
        file_path = file_entry.path.path
        response = FileResponse(open(file_path, 'rb'))

        # get original file name for the header
        original_file_name = file_entry.original_filename
        # set filename in header
        response['Content-Disposition'] = rfc5987_content_disposition(original_file_name)
        # set mime type to the stored mime type
        response['Content-Type'] = file_entry.mime_type + ';'

        return response

    @staticmethod
    def get_file_entry(**kwargs):
        pk = kwargs.get('pk')
        entry = UploadedFileEntry.objects.filter(pk=pk).select_related('file').first()

        # HTTP 404 if the user is not allowed to access the picture
        if not entry.file.is_viewable():
            raise NotFound

        return entry

    def destroy(self, request, *args, **kwargs):
        """
        Overwrite the destroy method to catch OSErrors when the NAS is busy and cannot delete a file for some reason
        :param request:
        :param args:
        :param kwargs:
        :return: Response
        """
        try:
            return super(FileViewSet, self).destroy(self, request, *args, **kwargs)
        except OSError as error:
            logger.error("FileCannotBeDeletedException: {}".format(error))
            raise FileCannotBeDeletedException()
