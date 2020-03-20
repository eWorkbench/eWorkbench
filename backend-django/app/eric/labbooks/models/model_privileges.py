#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.model_privileges.utils import BasePrivilege, UserPermission, register_privilege, \
    get_model_privileges_and_project_permissions_for
from eric.shared_elements.models import File, Note
from eric.pictures.models import Picture
from eric.labbooks.models import LabBook, LabbookSection
from eric.model_privileges.models import ModelPrivilege


@register_privilege(Picture, execution_order=999)
@register_privilege(File, execution_order=999)
@register_privilege(Note, execution_order=999)
@register_privilege(LabbookSection, execution_order=999)
class LabBookCellPrivilege(BasePrivilege):
    """
    If a user can view a LabBook, the user can also view all cells within the LabBook
    Same is true for edit: if a user can edit a labbook, the user can also edit all cells within the LabBook
    """
    @staticmethod
    def get_privileges(obj, permissions_by_user=dict()):
        # get all LabBooks that contain the picture
        lab_books = LabBook.objects.viewable().filter(
            child_elements__child_object_content_type=obj.get_content_type(),
            child_elements__child_object_id=obj.pk
        )

        # iterate over all those labbooks and collect the users that have the view privilege
        for lab_book in lab_books:
            # get privileges for the labbook
            lab_book_privileges = get_model_privileges_and_project_permissions_for(LabBook, lab_book)

            for priv in lab_book_privileges:
                user = priv.user

                # check if user is already in permissions_by_user
                if user.pk not in permissions_by_user.keys():
                    permissions_by_user[user.pk] = UserPermission(
                        user,
                        obj.pk, obj.get_content_type()
                    )

                # check if view privilege is set
                if priv.view_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW \
                        or priv.full_access_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
                    permissions_by_user[user.pk].view_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
                    permissions_by_user[user.pk].is_context_permission = True
                elif priv.view_privilege == ModelPrivilege.PRIVILEGE_CHOICES_DENY:
                    permissions_by_user[user.pk].view_privilege = ModelPrivilege.PRIVILEGE_CHOICES_DENY
                    permissions_by_user[user.pk].is_context_permission = True

                # check if edit privilege is set
                if priv.edit_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW \
                        or priv.full_access_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
                    permissions_by_user[user.pk].edit_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
                    permissions_by_user[user.pk].is_context_permission = True
                elif priv.edit_privilege == ModelPrivilege.PRIVILEGE_CHOICES_DENY:
                    permissions_by_user[user.pk].edit_privilege = ModelPrivilege.PRIVILEGE_CHOICES_DENY
                    permissions_by_user[user.pk].is_context_permission = True

        return permissions_by_user
