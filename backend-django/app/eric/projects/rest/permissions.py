#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" defines custom permission settings for the REST API """
from rest_framework import permissions


class CanInviteExternalUsers(permissions.BasePermission):
    """
    Checks whether a user is allowed to invite another (external) user via e-mail
    The user needs to have the global "invite_external_user" permission
    """

    def has_permission(self, request, view):
        return request.user and request.user.has_perms(["projects.invite_external_user"])


class IsStaffOrTargetUserOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow to edit the user if request.user == user or if is a staff member
    """

    def has_object_permission(self, request, view, obj):
        """ returns True when the request method is in SAFE_METHODS (e.g., GET, HEAD, OPTIONS), else it is checked
        if the object belongs to request.user """
        # allow GET / HEAD / OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for the same user
        return request.user.is_staff or obj == request.user
