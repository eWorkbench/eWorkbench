#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_userforeignkey.request import get_current_user

from eric.model_privileges.models import ModelPrivilege
from eric.model_privileges.utils import (
    BasePrivilege,
    UserPermission,
    get_model_privileges_and_project_permissions_for,
    register_privilege,
)
from eric.shared_elements.models import Contact, Meeting, Task


@register_privilege(Task)
class TaskPrivilege(BasePrivilege):
    """
    If a user is assigned to a Task, the same user is allowed to view and edit the task
    """

    @staticmethod
    def get_privileges(obj, permissions_by_user=None):
        permissions_by_user = permissions_by_user or dict()

        # iterate over all assigned users
        for assigned_user in obj.assigned_users.all():
            if assigned_user.pk not in permissions_by_user:
                # create a new privilege for the user
                permissions_by_user[assigned_user.pk] = UserPermission(
                    assigned_user, obj.pk, obj.get_content_type(), can_view=True, can_edit=True
                )
            else:
                # overwrite the privilege
                permissions_by_user[assigned_user.pk].view_privilege = ModelPrivilege.ALLOW
                permissions_by_user[assigned_user.pk].edit_privilege = ModelPrivilege.ALLOW

        return permissions_by_user


@register_privilege(Meeting)
class MeetingPrivilege(BasePrivilege):
    """
    If a user is attending a Meeting, the same user is allowed to view, edit, trash and restore the meeting
    """

    @staticmethod
    def get_privileges(obj, permissions_by_user=None):
        permissions_by_user = permissions_by_user or dict()

        # iterate over all assigned users
        for attending_user in obj.attending_users.all():
            if attending_user.pk not in permissions_by_user:
                # create a new privilege for the user
                permissions_by_user[attending_user.pk] = UserPermission(
                    attending_user,
                    obj.pk,
                    obj.get_content_type(),
                    can_view=True,
                    can_edit=True,
                    can_trash=True,
                    can_restore=True,
                )
            else:
                # overwrite the privilege
                permissions_by_user[attending_user.pk].view_privilege = ModelPrivilege.ALLOW
                permissions_by_user[attending_user.pk].edit_privilege = ModelPrivilege.ALLOW
                permissions_by_user[attending_user.pk].trash_privilege = ModelPrivilege.ALLOW
                permissions_by_user[attending_user.pk].restore_privilege = ModelPrivilege.ALLOW

        return permissions_by_user


@register_privilege(Meeting, execution_order=998)
class MeetingCalendarAccessPrivilege(BasePrivilege):
    """
    If a user was given privileges to another users calendar we have to mirror these here
    """

    @classmethod
    def get_privileges(cls, obj, permissions_by_user=None):
        from eric.model_privileges.models import ModelPrivilege
        from eric.shared_elements.models import CalendarAccess

        permissions_by_user = permissions_by_user or dict()

        calendar_access_privileges = ModelPrivilege.objects.all().filter(
            content_type=CalendarAccess.get_content_type(),
            user=get_current_user(),
            created_by=obj.created_by,
        )

        # integrate general CalendarAccess privileges to concrete privileges
        for calendar_privilege_object in calendar_access_privileges:
            for privilege in ModelPrivilege.PRIVILEGE_TO_PERMISSION_MAP.keys():
                cls.update_permission_map(permissions_by_user, obj, calendar_privilege_object, privilege)

        return permissions_by_user

    @classmethod
    def update_permission_map(cls, permissions_by_user, obj, calendar_privilege_object, privilege):
        """
        Updates the permission map: Sets
        """

        user = get_current_user()
        privilege_value = getattr(calendar_privilege_object, privilege)

        if privilege_value == ModelPrivilege.ALLOW:
            # create privilege object if none exists yet
            if user.pk not in permissions_by_user:
                permissions_by_user[user.pk] = UserPermission(user, obj.pk, obj.get_content_type())

            # set it to allowed
            setattr(permissions_by_user[user.pk], privilege, ModelPrivilege.ALLOW)


# The execution_order=999 parameter means that this Privilege is executed after Privileges with lower numbers.
# This is needed so the existing privileges are not overwritten with this one.
@register_privilege(Meeting, execution_order=999)
class MeetingResourcePrivilege(BasePrivilege):
    """
    If a user can edit a resource, the user is allowed to view, edit and trash and restore meetings where
    this resource is booked in
    """

    @staticmethod
    def get_privileges(obj, permissions_by_user=None):
        permissions_by_user = permissions_by_user or dict()

        from eric.projects.models import Resource

        if obj.resource:
            meeting_resource_is_editable = Resource.objects.editable().filter(pk=obj.resource.pk).exists()

            user = get_current_user()

            if meeting_resource_is_editable:
                # create a new privilege for the user
                permissions_by_user[user.pk] = UserPermission(
                    user, obj.pk, obj.get_content_type(), can_view=True, can_edit=True, can_trash=True, can_restore=True
                )

        return permissions_by_user


@register_privilege(Contact)
class ContactPrivilege(BasePrivilege):
    """
    If a user is attending a Meeting, the same user is allowed to view the contacts of a meeting
    """

    @staticmethod
    def get_privileges(obj, permissions_by_user=None):
        permissions_by_user = permissions_by_user or dict()

        # get all meetings where this contact is attending
        meetings = Meeting.objects.all().filter(attending_contacts=obj).prefetch_related("attending_users")

        # for each meeting, we need to add allow all attending_users the view privilege
        for meeting in meetings:
            meeting_privileges = get_model_privileges_and_project_permissions_for(Meeting, meeting)

            # iterate over all meeting privileges
            for priv in meeting_privileges:
                # if a view privilege is set on the meeting, the user is allowed to view the contact
                if priv.view_privilege == ModelPrivilege.ALLOW or priv.full_access_privilege == ModelPrivilege.ALLOW:
                    user = priv.user

                    if user.pk not in permissions_by_user:
                        # create a new privilege for the user
                        permissions_by_user[user.pk] = UserPermission(
                            user, obj.pk, obj.get_content_type(), can_view=True
                        )
                    else:
                        # overwrite the privilege
                        permissions_by_user[user.pk].view_privilege = ModelPrivilege.ALLOW

        return permissions_by_user
