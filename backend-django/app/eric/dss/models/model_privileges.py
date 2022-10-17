#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import Q

from eric.drives.models import Drive
from eric.dss.models import DSSContainer
from eric.model_privileges.models import ModelPrivilege
from eric.model_privileges.utils import (
    BasePrivilege,
    UserPermission,
    get_model_privileges_and_project_permissions_for,
    register_privilege,
)
from eric.shared_elements.models import File


# We register this privilege with a lower execution_order than DriveFilePrivilege and lower than
# LabBookCellPrivilege
# So DSSContainerFilePrivilege is executed first, then DriveFilePrivilege and then LabBookCellPrivilege
# The later executed privileges could "overwrite" the earlier executed privileges, so we always have to use unit tests
# to check if we get the results we intended and that nothing changes for the existing privileges
@register_privilege(File, execution_order=997)
class DSSContainerFilePrivilege(BasePrivilege):
    """
    If a user can view a DSS Container, the user can also view the files within the storage
    """

    @staticmethod
    def get_privileges(obj, permissions_by_user=None):
        permissions_by_user = permissions_by_user or dict()
        # get all drives that contain the file
        containers = DSSContainer.objects.viewable().filter(
            # related File
            dss_envelopes__drives__sub_directories__files__pk=obj.pk,
        )

        # iterate over all those containers and collect the users that have privileges
        for container in containers:
            # get privileges for the drive
            container_privileges = get_model_privileges_and_project_permissions_for(DSSContainer, container)

            for priv in container_privileges:
                user = priv.user
                # if the user is a DSS Curator
                if user.groups.filter(name="DSS Curator").exists():
                    # check if user is already in permissions_by_user
                    if user.pk not in permissions_by_user.keys():
                        permissions_by_user[user.pk] = UserPermission(user, obj.pk, obj.get_content_type())

                    # check if the full_access_privilege privilege is set for the container and the set the same for
                    # Files and Drives
                    if priv.full_access_privilege == ModelPrivilege.ALLOW:
                        permissions_by_user[user.pk].full_access_privilege = ModelPrivilege.ALLOW
                        permissions_by_user[user.pk].is_context_permission = True

        return permissions_by_user


@register_privilege(Drive, execution_order=997)
class DSSContainerDrivePrivilege(BasePrivilege):
    """
    If a user can view a DSS Container, the user can also view the storages within the envelopes
    """

    @staticmethod
    def get_privileges(obj, permissions_by_user=None):
        permissions_by_user = permissions_by_user or dict()
        # get all drives that contain the file
        containers = DSSContainer.objects.viewable().filter(
            dss_envelopes__drives__pk=obj.pk,
        )

        # iterate over all those containers and collect the users that have privileges
        for container in containers:
            # get privileges for the drive
            container_privileges = get_model_privileges_and_project_permissions_for(DSSContainer, container)

            for priv in container_privileges:
                user = priv.user
                # if the user is a DSS Curator
                if user.groups.filter(name="DSS Curator").exists():
                    # check if user is already in permissions_by_user
                    if user.pk not in permissions_by_user.keys():
                        permissions_by_user[user.pk] = UserPermission(user, obj.pk, obj.get_content_type())

                    # check if the full_access_privilege privilege is set for the container and the set the same for
                    # Files and Drives
                    if priv.full_access_privilege == ModelPrivilege.ALLOW:
                        permissions_by_user[user.pk].full_access_privilege = ModelPrivilege.ALLOW
                        permissions_by_user[user.pk].is_context_permission = True

        return permissions_by_user
