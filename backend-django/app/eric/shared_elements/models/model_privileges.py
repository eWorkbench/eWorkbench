#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_userforeignkey.request import get_current_user

from eric.model_privileges.utils import BasePrivilege, UserPermission, register_privilege, \
    get_model_privileges_and_project_permissions_for
from eric.shared_elements.models import Task, Meeting, Contact
from eric.model_privileges.models import ModelPrivilege


@register_privilege(Task)
class TaskPrivilege(BasePrivilege):
    """
    If a user is assigned to a Task, the same user is allowed to view and edit the task
    """
    @staticmethod
    def get_privileges(obj, permissions_by_user=dict()):

        # iterate over all assigned users
        for assigned_user in obj.assigned_users.all():
            if assigned_user.pk not in permissions_by_user:
                # create a new privilege for the user
                permissions_by_user[assigned_user.pk] = UserPermission(
                    assigned_user,
                    obj.pk, obj.get_content_type(),
                    is_context_permission=True, can_view=True, can_edit=True
                )
            else:
                # overwrite the privilege
                permissions_by_user[assigned_user.pk].view_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
                permissions_by_user[assigned_user.pk].edit_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW

        return permissions_by_user


@register_privilege(Meeting)
class MeetingPrivilege(BasePrivilege):
    """
    If a user is attending a Meeting, the same user is allowed to view the meeting
    """
    @staticmethod
    def get_privileges(obj, permissions_by_user=dict()):

        # iterate over all assigned users
        for attending_user in obj.attending_users.all():
            if attending_user.pk not in permissions_by_user:
                # create a new privilege for the user
                permissions_by_user[attending_user.pk] = UserPermission(
                    attending_user,
                    obj.pk, obj.get_content_type(),
                    is_context_permission=True, can_view=True
                )
            else:
                # overwrite the privilege
                permissions_by_user[attending_user.pk].view_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
                permissions_by_user[attending_user.pk].edit_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW

        return permissions_by_user


# The execution_order=999 parameter means that this Privilege is executed after Privileges with lower numbers.
# This is needed so the existing privileges are not overwritten with this one.
@register_privilege(Meeting, execution_order=999)
class MeetingResourcePrivilege(BasePrivilege):
    """
    If a user can edit a resource, the user is allowed to view, edit and trash and restore meetings where
    this resource is booked in
    """
    @staticmethod
    def get_privileges(obj, permissions_by_user=dict()):
        from eric.projects.models import Resource

        if obj.resource:
            meeting_resource_is_editable = Resource.objects.editable().filter(pk=obj.resource.pk).exists()

            user = get_current_user()

            if meeting_resource_is_editable:
                # create a new privilege for the user
                permissions_by_user[user.pk] = UserPermission(
                    user,
                    obj.pk, obj.get_content_type(),
                    is_context_permission=True, can_view=True, can_edit=True, can_trash=True, can_restore=True
                )

        return permissions_by_user


@register_privilege(Contact)
class ContactPrivilege(BasePrivilege):
    """
    If a user is attending a Meeting, the same user is allowed to view the contacts of a meeting
    """

    @staticmethod
    def get_privileges(obj, permissions_by_user=dict()):
        # get all meetings where this contact is attending
        meetings = Meeting.objects.all().filter(
            attending_contacts=obj
        ).prefetch_related('attending_users')

        # for each meeting, we need to add allow all attending_users the view privilege
        for meeting in meetings:
            meeting_privileges = get_model_privileges_and_project_permissions_for(Meeting, meeting)

            # iterate over all meeting privileges
            for priv in meeting_privileges:
                # if a view privilege is set on the meeting, the user is allowed to view the contact
                if priv.view_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW \
                        or priv.full_access_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
                    user = priv.user

                    if user.pk not in permissions_by_user:
                        # create a new privilege for the user
                        permissions_by_user[user.pk] = UserPermission(
                            user,
                            obj.pk, obj.get_content_type(),
                            is_context_permission=True, can_view=True
                        )
                    else:
                        # overwrite the privilege
                        permissions_by_user[user.pk].view_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW

        return permissions_by_user
