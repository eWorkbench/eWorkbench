#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import zipstream
from django.db import transaction
from django.http import QueryDict, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn, BaseAuthenticatedModelViewSet
from eric.drives.models import Drive
from eric.drives.models.models import Directory
from eric.drives.rest.filters import DriveFilter
from eric.drives.rest.serializers import DriveSerializer, DirectorySerializer
from eric.dss.models import DSSContainer
from eric.projects.models.exceptions import ContainerReadWriteException
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet
from eric.shared_elements.models import File


class DriveSubDirectoriesViewSet(BaseAuthenticatedModelViewSet):
    """
    REST API ViewSet for Directories within a Drive
    """

    serializer_class = DirectorySerializer

    # disable pagination for this endpoint
    pagination_class = None

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(DriveSubDirectoriesViewSet, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(self.request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            self.request.data._mutable = True

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        self.request.data['drive_id'] = self.parent_object.pk

        response = super(DriveSubDirectoriesViewSet, self).create(request, *args, **kwargs)

        # trigger a change of the parent object to trigger the changeset
        self.parent_object.save()

        return response

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        self.request.data['drive_id'] = self.parent_object.pk

        # get the existing drive
        drive = self.parent_object

        if drive.is_dss_drive:
            # lets get the container setting now
            container_read_write_setting = drive.envelope.container.read_write_setting
            read_write_only_new = DSSContainer.READ_WRITE_ONLY_NEW
            if container_read_write_setting == read_write_only_new and drive.imported:
                raise ContainerReadWriteException(read_write_only_new)

        response = super(DriveSubDirectoriesViewSet, self).update(request, *args, **kwargs)

        # trigger a change of the parent object to trigger the changeset
        self.parent_object.save()

        return response

    def destroy(self, request, *args, **kwargs):
        self.request.data['drive_id'] = self.parent_object.pk

        response = super(DriveSubDirectoriesViewSet, self).destroy(request, *args, **kwargs)

        # trigger a change of the parent object to trigger the changeset
        self.parent_object.save()

        return response

    def get_serializer(self, *args, **kwargs):
        """ if an array is passed, set serializer to many """
        if isinstance(kwargs.get('data', {}), list):
            kwargs['many'] = True
        return super(DriveSubDirectoriesViewSet, self).get_serializer(*args, **kwargs)

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        """
        return get_object_or_404(Drive.objects.viewable(), pk=kwargs['drive_pk'])

    @action(detail=True, methods=['GET'], url_path='download', url_name='download')
    def download_directory_with_files_as_zipfile(self, request, format=None, *args, **kwargs):
        """ Provides a detail route endpoint for downloading a directory with a zipfile """
        # get the picture
        directory = self.get_object()

        root_directory_path = directory.full_directory_path

        # get all directories that are sub directories
        sub_directory_pks = directory.all_sub_directory_pks

        # get original file name for the header
        print("Direcotry name='{}'".format(directory.name))

        if directory.name == '/' and directory.is_virtual_root:
            original_file_name = "{}.zip".format(directory.drive.title)
        else:
            original_file_name = "{}.zip".format(directory.name)

        files = File.objects.viewable().not_deleted().filter(directory__in=sub_directory_pks).order_by('directory')

        zs = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)

        for file in files:
            directory_path = file.directory.full_directory_path.replace(root_directory_path, "")
            actual_filename = "{}/{}".format(directory_path, file.original_filename)

            zs.write(
                file.path.path,
                arcname=actual_filename
            )

        response = StreamingHttpResponse(zs, content_type='application/zip')

        # set filename in header
        response['Content-Disposition'] = 'attachment; filename="{}"'.format(original_file_name)

        return response

    def get_queryset(self):
        if hasattr(self, 'parent_object') and self.parent_object:
            drive_pk = self.parent_object.pk
        else:
            drive_pk = None

        return Directory.objects.viewable().filter(drive=drive_pk)


class DriveViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn
):
    serializer_class = DriveSerializer
    filterset_class = DriveFilter

    def update(self, request, *args, **kwargs):
        if kwargs['pk']:
            # get the existing drive
            drive = Drive.objects.filter(pk=kwargs['pk']).first()

            if drive.is_dss_drive:
                # lets get the container setting now
                container_read_write_setting = drive.envelope.container.read_write_setting
                read_write_only_new = DSSContainer.READ_WRITE_ONLY_NEW
                if container_read_write_setting == read_write_only_new and drive.imported:
                    raise ContainerReadWriteException(read_write_only_new)

        return super(DriveViewSet, self).update(request, *args, **kwargs)

    def get_queryset(self):
        """
        returns the queryset for Drive viewable objects,
        filtered by project primary (optional)
        """
        return Drive.objects.viewable().prefetch_common().prefetch_related('projects')
