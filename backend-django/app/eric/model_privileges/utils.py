#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model

from eric.model_privileges.models import ModelPrivilege

User = get_user_model()


def UserPermission(
        user, object_id, content_type,
        is_project_permission=False, is_context_permission=False,
        can_view=False, can_edit=False, can_delete=False, can_restore=False, can_trash=False, is_owner=False
):
    """
    Wrapper for creating a fake ModelPrivilege
    :return:
    """
    return ModelPrivilege(
        user=user,
        full_access_privilege=ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        if is_owner else ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL,
        view_privilege=ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        if can_view else ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL,
        edit_privilege=ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        if can_edit else ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL,
        trash_privilege=ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        if can_trash else ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL,
        delete_privilege=ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        if can_delete else ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL,
        restore_privilege=ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        if can_restore else ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL,
        object_id=object_id,
        content_type=content_type
    )


def collect_additional_privileges_for(entity, obj, for_user=None):
    """
    Collects additional privileges based on the given entity (e.g., inherited for a task)
    :param entity:
    :param obj:
    :return:
    """
    permissions_by_user = {}

    # for the specified entity get all privileges and process them
    if entity in privileges_by_class:
        privs = privileges_by_class[entity]

        # iterate over all privilege classes for this entity
        for priv in privs:
            priv_cls = priv['privilege_cls']
            # execute the privilege by calling "get_privileges"
            permissions_by_user = priv_cls.get_privileges(obj, permissions_by_user)

    # check if we need to filter permissions for a specific user
    if for_user:
        # check if we have privileges for this user
        if for_user.pk in permissions_by_user:
            return {
                for_user.pk: permissions_by_user[for_user.pk]
            }

        return {
            for_user.pk: UserPermission(for_user, obj.pk, obj.get_content_type())
        }

    return permissions_by_user


def get_project_and_additional_inherited_privileges_for(entity, obj, user=None):
    """
    collects project and inherited privileges
    :param entity:
    :param obj:
    :param user:
    :return:
    """
    permissions_by_user = collect_additional_privileges_for(entity, obj, user)

    # verify that this object is project related (it should be)
    if hasattr(obj, 'projects'):
        for project in obj.projects.all():
            # from the current project, get all assigned users with
            # any permission related to the content type of object
            assigned_users = project.get_assigned_user_up_full().filter(
                role__permissions__content_type=obj.get_content_type()
            )

            if user:
                assigned_users = assigned_users.filter(user=user)

            # now order/select this permissions by user and the permission codename
            role_permissions = assigned_users.values(
                'user', 'role__permissions__codename'
            ).order_by('user')

            # prefetch users
            user_pks = role_permissions.values_list('user', flat=True)
            users = User.objects.filter(pk__in=user_pks).in_bulk()

            # collect role permissions by user (edit, delete, view) in the permission_by_user dict
            for rp in role_permissions:
                # get the user_pk
                user_pk = rp['user']
                # make sure an entry for user exists in permissions_by_user
                if user_pk not in permissions_by_user:
                    # does not exist --> create a new entry and set defaults to False
                    permissions_by_user[user_pk] = UserPermission(
                        users.get(user_pk),
                        obj.pk,
                        obj.get_content_type(),
                        is_project_permission=True
                    )

                perm = rp['role__permissions__codename']

                # permissions_by_user[user]['is_project_permission'] = True

                if "change_" in perm:
                    permissions_by_user[user_pk].edit_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
                elif "delete_" in perm:
                    permissions_by_user[user_pk].delete_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
                elif "view_" in perm:
                    permissions_by_user[user_pk].view_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
                elif "trash_" in perm:
                    permissions_by_user[user_pk].trash_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
                elif "restore_" in perm:
                    permissions_by_user[user_pk].restore_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW

    return permissions_by_user


def get_model_privileges_and_project_permissions_for(entity, obj, user=None):
    """
    Returns a list of model privileges for the provided entity class and object
    :param entity:
    :type entity: class
    :param obj:
    :type obj: BaseModel
    :param user:
    :return:
    """
    # get all inherited privileges (e.g., by project role user assignment, task assigned users, etc...)
    inherited_privileges_by_user = get_project_and_additional_inherited_privileges_for(entity, obj, user=user)

    # get model privileges of the current obj
    mp_qs = obj.model_privileges.all()

    # if a user was set, limit the model privileges queryset to model privileges for the current user
    if user:
        mp_qs = mp_qs.filter(user=user)

    # get model privileges for the current object, and convert them into a list so we can work with them
    model_privileges = list(
        mp_qs.select_related('user', 'user__userprofile', 'content_type')
    )

    # iterate over model privileges and set some additional attributes
    for model_privilege in model_privileges:
        # set the content object as the parent_object
        model_privilege.content_object = obj
        # check if a user exists
        if model_privilege.user_id in inherited_privileges_by_user:
            user_pp = inherited_privileges_by_user[model_privilege.user_id]

            # check users project permission for the view privilege
            if user_pp.view_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW \
                    and model_privilege.view_privilege != ModelPrivilege.PRIVILEGE_CHOICES_DENY:
                model_privilege.view_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
            # check users project permission for the edit privilege
            if user_pp.edit_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW \
                    and model_privilege.edit_privilege != ModelPrivilege.PRIVILEGE_CHOICES_DENY:
                model_privilege.edit_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
            # check users project permission for the delete privilege
            if user_pp.delete_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW \
                    and model_privilege.delete_privilege != ModelPrivilege.PRIVILEGE_CHOICES_DENY:
                model_privilege.delete_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
            # check users project permission for the trash privilege
            if user_pp.trash_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW \
                    and model_privilege.trash_privilege != ModelPrivilege.PRIVILEGE_CHOICES_DENY:
                model_privilege.trash_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
            # check users project permission for the restore privilege
            if user_pp.restore_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW \
                    and model_privilege.restore_privilege != ModelPrivilege.PRIVILEGE_CHOICES_DENY:
                model_privilege.restore_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
            # check users project permission for the full access privilege
            if user_pp.full_access_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW \
                    and model_privilege.full_access_privilege != ModelPrivilege.PRIVILEGE_CHOICES_DENY:
                model_privilege.full_access_privilege = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW

            del inherited_privileges_by_user[model_privilege.user_id]

    # iterate over remaining project_permissions
    for user_id, model_privilege in inherited_privileges_by_user.items():
        model_privilege.pk = ""
        model_privileges.append(model_privilege)

    return model_privileges


class BasePrivilege(object):
    """
    Base Privilege that should be inherited by other privileges
    needs to implement static method get_privileges(obj)
    """

    @staticmethod
    def get_privileges(obj):
        raise NotImplementedError


"""
Dictionary which contains all registered privileges
"""
privileges_by_class = {}


def register_privilege(model_cls=None, execution_order=0, **kwargs):
    """
    Registers a privilege for a specified model class with a given execution order, where as privilege with
    execution_order=0 is executed before a privilege with execution_order=1, etc...
    :param model_cls: the model class
    :param execution_order: order of execution (positive integer)
    :type execution_order: int
    :param kwargs:
    :return:
    """

    def _register_privilege_wrapper(privilege_cls):
        # make sure model_class is set
        if not model_cls:
            raise ValueError("A Model Class needs to be passed to this decorator")

        # check that privilege_cls has a "get_privileges" method
        if not hasattr(privilege_cls, "get_privileges"):
            raise ValueError("The decorated object needs to be class that implements get_privileges(obj)")

        if model_cls not in privileges_by_class:
            privileges_by_class[model_cls] = []

        privileges_by_class[model_cls].append({
            'execution_order': execution_order,
            'privilege_cls': privilege_cls
        })

        # sort privileges_by_class[model_cls]
        privileges_by_class[model_cls] = sorted(
            privileges_by_class[model_cls], key=lambda value: value['execution_order']
        )

        return privilege_cls

    return _register_privilege_wrapper
