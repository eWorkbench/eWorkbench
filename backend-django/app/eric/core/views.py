#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import logging
import os

import pkg_resources
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.cache import cache_page
from drf_yasg.utils import swagger_auto_schema
from git import Repo
from memoize import memoize
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import MethodNotAllowed, ValidationError
from rest_framework.response import Response

from eric.core.models import DisableSignals
from eric.core.models.abstract import WorkbenchEntityMixin, get_all_workbench_models
from eric.core.permission_classes import IsSuperuser
from eric.metadata.models.models import Metadata
from eric.projects.models import Project
from eric.versions.models.models import Version

js_error_logger = logging.getLogger('js_errors')


def get_pkg_metadata(pkgname, metadata_key="License"):
    """
    Given a package reference (as from requirements.txt),
    return license listed in package metadata.
    NOTE: This function does no error checking and is for
    demonstration purposes only.
    """
    pkgs = pkg_resources.require(pkgname)
    pkg = pkgs[0]
    try:
        for line in pkg.get_metadata_lines('METADATA'):
            if ": " in line:
                (k, v) = line.split(': ', 1)

                if k.upper() == metadata_key.upper():
                    return v

    except FileNotFoundError:
        return None

    return None


@memoize(timeout=60 * 60)
def get_current_version_from_git():
    """
    Returns a string of the current version from GIT
    This is cached via memoize for an hour
    :return: current version from git, e.g. "master (+1)"
    """
    lastcwd = os.getcwd()
    repodir = os.path.join(lastcwd, '..')

    try:
        r = Repo(repodir)
        git_description = str(r.git.describe(tags=True))
        # check if this is a version which is tagged or not
        if '-' in git_description:
            # not tagged --> long name like tagNumber-numberOfCommitsAhead-commitId
            data = git_description.split('-')

            version = "{tag} (+{number_of_commits_ahead_of_tag}/{branch_name})".format(
                tag=data[0],
                number_of_commits_ahead_of_tag=data[1],
                describe=r.git.describe(),
                branch_name=r.active_branch.name,
            )

        else:
            # tagged
            version = git_description
    except:
        # could not determine repository version
        version = "Unknown version"

    return version


@memoize(timeout=60 * 60)
def get_current_version_from_version_file():
    """
    Returns a string of the current version from a version file located in the app dir
    This is cached via memoize for an hour
    :return: current version from git, e.g. "master (+1)"
    """
    try:
        with open("version.txt") as infile:
            version = infile.read().strip()
    except:
        # could not determine repository version
        version = "Unknown version"

    return version


def current_version_view(request):
    """
    View that determines the current git repository version and branch and returns it
    :param request:
    :return: HttpResponse
    """
    version = get_current_version_from_git()

    if version == "Unknown version":
        version = get_current_version_from_version_file()

    return HttpResponse(version, content_type='text')


@cache_page(60 * 15)
def oss_license_json(request):
    """
    View that determines all python libraries and their licenses
    :param request:
    :return: HttpResponse
    """
    license_json = []

    from updatable import get_environment_requirements_list

    installed_libraries = get_environment_requirements_list()

    for library in installed_libraries:
        one_license = dict()

        one_license["key"] = library.split("==")[0]
        one_license["licenses"] = get_pkg_metadata(library, "License")
        one_license["repository"] = get_pkg_metadata(library, "Home-page")

        license_json.append(one_license)

    return HttpResponse(json.dumps(license_json), content_type="application/json")


def js_error_logger_view(request):
    """
    View that allows logging of javascript errors
    :param request:
    :return:
    """
    if request.method != 'POST':
        raise MethodNotAllowed

    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)

    if "error_url" in body and "error_message" in body and "cause" in body and "backend_version" in body:
        # add ip and user agent to body
        body['user_agent'] = request.META['HTTP_USER_AGENT']

        if hasattr(request, "user") and request.user:
            body['user'] = str(request.user)
        else:
            body['user'] = "anonymous"

        js_error_logger.error(json.dumps(body, sort_keys=True, indent=2, separators=(',', ': ')))

        return HttpResponse(status=200)
    else:
        raise ValidationError


@swagger_auto_schema(methods=['post'], auto_schema=None)  # disable automated API schema generation
@permission_classes(permission_classes=(IsSuperuser,))
@api_view(['POST'])
def clean_workbench_models(request, *args, **kwargs):
    """ Purges data from all workbench models. """

    if not hasattr(settings, 'CLEAN_ALL_WORKBENCH_MODELS') or not settings.CLEAN_ALL_WORKBENCH_MODELS:
        return Response({'error': 'Operation is not enabled in settings.'}, status=status.HTTP_404_NOT_FOUND)

    if not request.user.is_authenticated:
        return Response({'error': 'You need to be logged in.'}, status=status.HTTP_401_UNAUTHORIZED)

    all_workbench_models = get_all_workbench_models(WorkbenchEntityMixin)

    # disable all model-receivers (e.g. check_model_privileges, which may block the deletion)
    with DisableSignals():
        for model in all_workbench_models:
            model.objects.all().delete()
        for record in Project.objects.all():
            record.trash()
        Version.objects.all().delete()
        Metadata.objects.all().delete()

    return Response({'status': 'ok'}, status=200)
