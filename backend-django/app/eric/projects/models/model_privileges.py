#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.model_privileges.utils import BasePrivilege, UserPermission, register_privilege
from eric.projects.models.models import Resource
from eric.model_privileges.models import ModelPrivilege


@register_privilege(Resource)
class ResourceSelectedPrivilege(BasePrivilege):
    """
    If a user is explicitly selected for a Resource (user_availability_selected_users) he will get the view permission
    """
    @staticmethod
    def get_privileges(obj, permissions_by_user=dict()):
        # iterate over all selected users
        for selected_user in obj.user_availability_selected_users.all():
            if selected_user.pk not in permissions_by_user:
                # create a new privilege for the user
                permissions_by_user[selected_user.pk] = UserPermission(
                    selected_user,
                    obj.pk, obj.get_content_type(),
                    is_context_permission=True, can_view=True
                )
            else:
                # overwrite the privilege
                permissions_by_user[selected_user.pk].view_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW

        return permissions_by_user
