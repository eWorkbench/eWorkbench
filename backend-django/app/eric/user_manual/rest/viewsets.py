#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import re

import os

import errno
import zipstream
import zipfile

from django.conf import settings
from django.core import serializers
from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from rest_framework.decorators import action
from rest_framework.response import Response

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn, BaseAuthenticatedReadOnlyModelViewSet
from eric.projects.rest.viewsets.base import BaseAuthenticatedModelViewSet
from eric.user_manual import HELP_TEXT_CACHE_KEY

from eric.user_manual.models import UserManualCategory, UserManualHelpText, UserManualPlaceholder
from eric.user_manual.rest.filters import UserManualHelpTextFilter
from eric.user_manual.rest.serializers import UserManualHelpTextSerializer, UserManualCategorySerializer


class UserManualHelper:
    @staticmethod
    def get_serialized_categories():
        """
        Returns a serialized string of categories
        :return:
        """
        categories = UserManualCategory.objects.all()

        return serializers.serialize("xml", categories, fields=(
            'id', 'title', 'description', 'ordering', 'created_at', 'last_modified_at'))

    @staticmethod
    def collect_all_media_files_from_html(html_string):
        pattern = re.compile(r'\${MEDIA_URL}([^,\s\"])*')

        matches = pattern.finditer(html_string)

        collected_files = []

        for match in matches:
            collected_files.append(match.group(0))

        # return a unique list of files
        return list(set(collected_files))

    @staticmethod
    def get_serialized_placeholders():
        """
        Returns a serialized string of placeholders
        :return:
        """
        placeholders = UserManualPlaceholder.objects.all()

        serialized_placeholders = serializers.serialize("xml", placeholders, fields=(
            'id', 'key', 'content', 'created_at', 'last_modified_at'))

        # find all occurances of the current media url and replace it with something variable
        serialized_placeholders = serialized_placeholders.replace(settings.MEDIA_URL, "${MEDIA_URL}/")

        return serialized_placeholders

    @staticmethod
    def get_serialized_user_manual_texts():
        """
        Returns a serialized string of manual texts
        :return:
        """
        manual_texts = UserManualHelpText.objects.all()

        serialized_manual_texts = serializers.serialize("xml", manual_texts, fields=(
            'id', 'title', 'text', 'category', 'ordering', 'created_at', 'last_modified_at'))

        # find all occurances of the current media url and replace it with something variable
        serialized_manual_texts = serialized_manual_texts.replace(settings.MEDIA_URL, "${MEDIA_URL}/")

        return serialized_manual_texts


class UserManualHelpTextViewset(
    BaseAuthenticatedReadOnlyModelViewSet
):
    """ REST API Viewset for User Manual Help Texts """
    serializer_class = UserManualHelpTextSerializer
    filterset_class = UserManualHelpTextFilter
    search_fields = ('title', )

    # disable pagination for this endpoint
    pagination_class = None

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(UserManualHelpTextViewset, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        :param args:
        :param kwargs:
        :return:
        """
        return get_object_or_404(UserManualCategory.objects.all(), pk=kwargs['usermanualcategory_pk'])

    def list(self, request, *args, **kwargs):
        """
        Cached list response
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        cache_key = HELP_TEXT_CACHE_KEY % self.parent_object.pk

        # verify if we have a cached copy of the help texts
        serializer_data = cache.get(cache_key, None)

        if not serializer_data:
            # we don't have a cached copy, we need to construct it now
            queryset = self.filter_queryset(self.get_queryset())

            serializer = self.get_serializer(queryset, many=True)

            serializer_data = serializer.data

            cache.set(cache_key, serializer_data)

        return Response(serializer_data)

    def get_queryset(self):
        return UserManualHelpText.objects.filter(category=self.parent_object).prefetch_related(
            'category',
            'created_by', 'last_modified_by'
        )


class UserManualCategoriesViewset(
    BaseAuthenticatedReadOnlyModelViewSet
):
    """ REST API Viewset for User Manual Category """

    serializer_class = UserManualCategorySerializer

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return UserManualCategory.objects.all()

    @action(detail=False, methods=['GET'])
    def export_user_manual(self, request, *args, **kwargs):
        """
        Exports the user manual as a zip file
        :return:
        """
        # verify the current user is staff
        if not request.user or not request.user.is_staff:
            raise PermissionDenied

        zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)

        serialized_categories = UserManualHelper.get_serialized_categories()
        zf.writestr("categories.xml", serialized_categories.encode())

        serialized_placeholders = UserManualHelper.get_serialized_placeholders()
        zf.writestr("placeholders.xml", serialized_placeholders.encode())

        serialized_help_texts = UserManualHelper.get_serialized_user_manual_texts()
        zf.writestr("help_texts.xml", serialized_help_texts.encode())

        collected_files = UserManualHelper.collect_all_media_files_from_html(
            serialized_placeholders + serialized_help_texts
        )

        for file in collected_files:
            actual_file = file.replace("${MEDIA_URL}", settings.MEDIA_ROOT)

            zf.write(actual_file, arcname=file)

        response = StreamingHttpResponse(zf, content_type='application/zip')

        # set filename in header
        response['Content-Disposition'] = 'attachment; filename="{}"'.format("user_manual.zip")

        return response

    @action(detail=False, methods=['POST'])
    def import_user_manual(self, request, *args, **kwargs):
        """
        Imports the user manual as a zip file
        :return:
        """
        # verify the current user is staff
        if not request.user or not request.user.is_staff:
            raise PermissionDenied

        # make sure user has permissions to add, edit and delete the user manual
        if not request.user.has_perms([
            'user_manual.add_usermanualhelptext',
            'user_manual.add_usermanualplaceholder',
            'user_manual.add_usermanualcategory',
            'user_manual.change_usermanualhelptext',
            'user_manual.change_usermanualplaceholder',
            'user_manual.change_usermanualcategory',
            'user_manual.delete_usermanualhelptext',
            'user_manual.delete_usermanualplaceholder',
            'user_manual.delete_usermanualcategory'
        ]):
            raise PermissionDenied

        file_obj = request.data['file']

        # clean existing database entries
        UserManualCategory.objects.all().delete()
        UserManualPlaceholder.objects.all().delete()
        UserManualHelpText.objects.all().delete()

        # open zipfile
        zf = zipfile.ZipFile(file_obj, "r")

        # process categories
        with zf.open("categories.xml") as categories_file:
            for category in serializers.deserialize("xml", categories_file):
                print(category)
                # set last modified and created by
                category.object.last_modified_by = category.object.created_by = request.user
                category.save()

        # process placeholders
        with zf.open("placeholders.xml") as placeholders_file:
            for placeholder in serializers.deserialize("xml", placeholders_file):
                print(placeholder)
                # set last modified and created by
                placeholder.object.last_modified_by = placeholder.object.created_by = request.user

                # replace ${MEDIA_URL}
                placeholder.object.content = placeholder.object.content.replace("${MEDIA_URL}", settings.MEDIA_URL)

                placeholder.save()

        # process help texts
        with zf.open("help_texts.xml") as help_texts_file:
            for help_text in serializers.deserialize("xml", help_texts_file):
                print(help_text)
                # set last modified and created by
                help_text.object.last_modified_by = help_text.object.created_by = request.user

                # replace ${MEDIA_URL}
                help_text.object.text = help_text.object.text.replace("${MEDIA_URL}", settings.MEDIA_URL)

                help_text.save()

        # process media/static files
        for filename in zf.namelist():
            # ignore already processed files
            if filename in ["categories.xml", "placeholders.xml", "help_texts.xml"]:
                continue

            external_filename = filename.replace("${MEDIA_URL}", settings.MEDIA_ROOT)

            data = zf.read(filename)

            # check if directory exists
            if not os.path.exists(os.path.dirname(external_filename)):
                try:
                    os.makedirs(os.path.dirname(external_filename))
                except OSError as exc:  # Guard against race condition
                    if exc.errno != errno.EEXIST:
                        raise

            # write file
            with open(external_filename, "wb") as newfile:
                newfile.write(data)

        zf.close()

        return Response(status=200)
