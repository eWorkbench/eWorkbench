#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.drives.models import Drive
from eric.model_privileges.models import ModelPrivilege
from eric.model_privileges.utils import BasePrivilege, UserPermission, register_privilege, \
    get_model_privileges_and_project_permissions_for
from eric.shared_elements.models import File


# We register this privilege with a lower execution_order than LabBookCellPrivilege and higher than
# DSSContainerFilePrivilege
# So DSSContainerFilePrivilege is executed first, then DriveFilePrivilege and then LabBookCellPrivilege
# The later executed privileges could "overwrite" the earlier executed privileges, so we always have to use unit tests
# to check if we get the results we intended and that nothing changes for the existing privileges
@register_privilege(File, execution_order=998)
class DriveFilePrivilege(BasePrivilege):
    """
    If a user can view a Drive, the user can also view the files within the drive
    """

    @staticmethod
    def get_privileges(obj, permissions_by_user=None):
        permissions_by_user = permissions_by_user or dict()

        # get all drives that contain the picture
        drives = Drive.objects.viewable().filter(
            sub_directories__files__pk=obj.pk
        )

        # iterate over all those drives and collect the users that have the view privilege
        for drive in drives:
            # get privileges for the labbook
            drive_privileges = get_model_privileges_and_project_permissions_for(Drive, drive)

            for priv in drive_privileges:
                user = priv.user

                # check if user is already in permissions_by_user
                if user.pk not in permissions_by_user.keys():
                    permissions_by_user[user.pk] = UserPermission(
                        user,
                        obj.pk, obj.get_content_type()
                    )

                # check if view privilege is set
                if priv.view_privilege == ModelPrivilege.ALLOW or priv.full_access_privilege == ModelPrivilege.ALLOW:
                    permissions_by_user[user.pk].view_privilege = ModelPrivilege.ALLOW
                elif priv.view_privilege == ModelPrivilege.DENY:
                    permissions_by_user[user.pk].view_privilege = ModelPrivilege.DENY

                # check if edit privilege is set
                # if priv.edit_privilege == ModelPrivilege.ALLOW \
                #         or priv.full_access_privilege == ModelPrivilege.ALLOW:
                #     permissions_by_user[user.pk].edit_privilege = ModelPrivilege.ALLOW
                # elif priv.edit_privilege == ModelPrivilege.DENY:
                #     permissions_by_user[user.pk].edit_privilege = ModelPrivilege.DENY

        return permissions_by_user
