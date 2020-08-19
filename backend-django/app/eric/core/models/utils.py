#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os

from django.conf import settings
from django.http import FileResponse, HttpResponse


def get_permission_name(model_class, permission_name):
    """
    combines the name of the class and the permission name as follows:
    %(model_class.app_label)s.%(permission_name)s_%(model_class.model_name)s

    :param model_class: the model class used to generate the permission label
    :type model_class: django.db.models.Model
    :param permission_name: the name of the permission used to generate the permission label
    :type permission_name: basestring
    :return: combined permission label
    :rtype: basestring
    """
    return '%(app_label)s.%(permission_name)s_%(model_name)s' % {
        'app_label': model_class._meta.app_label,
        'model_name': model_class._meta.model_name,
        'permission_name': permission_name,
    }


def get_permission_name_without_app_label(model_class, permission_name):
    """
    combines the name of the class and the permission name as follows:
    %(model_class.app_label)s.%(permission_name)s_%(model_class.model_name)s

    :param model_class: the model class used to generate the permission label
    :type model_class: django.db.models.Model
    :param permission_name: the name of the permission used to generate the permission label
    :type permission_name: basestring
    :return: combined permission label
    :rtype: basestring
    """
    return '%(permission_name)s_%(model_name)s' % {
        'model_name': model_class._meta.model_name,
        'permission_name': permission_name,
    }


def get_permission_name_change_related_project(model_class, permission_name):
    """
    combines the name of the class and the permission name as follows:
    %(model_class.app_label)s.%(model_class.model_name)s_%(permission_name)s

    :param model_class: the model class used to generate the permission label
    :type model_class: django.db.models.Model
    :param permission_name: the name of the permission used to generate the permission label
    :type permission_name: basestring
    :return: combined permission label
    :rtype: basestring
    """
    return '%(app_label)s.%(model_name)s_%(permission_name)s' % {
        'app_label': model_class._meta.app_label,
        'model_name': model_class._meta.model_name,
        'permission_name': permission_name,
    }


def get_permission_name_change_related_project_without_app_label(model_class, permission_name):
    """
    combines the name of the class and the permission name as follows:
    %(model_class.app_label)s.%(model_class.model_name)s_%(permission_name)s

    :param model_class: the model class used to generate the permission label
    :type model_class: django.db.models.Model
    :param permission_name: the name of the permission used to generate the permission label
    :type permission_name: basestring
    :return: combined permission label
    :rtype: basestring
    """
    return '%(model_name)s_%(permission_name)s' % {
        'model_name': model_class._meta.model_name,
        'permission_name': permission_name,
    }


def pk_or_none(obj):
    return obj.pk if obj is not None else None


def build_download_response(mime_type, file):
    file_path = os.path.join(settings.MEDIA_ROOT, file.name)
    if os.path.isfile(file_path):
        response = FileResponse(open(file_path, 'rb'))
    else:
        response = HttpResponse("")

    response['Content-Disposition'] = 'attachment; filename="{}"'.format(file.name)
    response['Content-Type'] = mime_type

    return response
