#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.core.exceptions import ValidationError, PermissionDenied
from django.db.models.signals import post_save, pre_save, pre_delete, post_delete
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ugettext_lazy as _
from django_userforeignkey.request import get_current_user

from eric.core.models import permission_checks_disabled
from eric.model_privileges.models.models import ModelPrivilege

logger = logging.getLogger('eric.model_privileges.handlers')


@receiver(pre_save, sender=ModelPrivilege)
@receiver(pre_delete, sender=ModelPrivilege)
def check_model_privileges(instance, *args, **kwargs):
    """
    Checks whether editing ModelPrivileges is allowed or not; A ModelPrivilege entry is always related to an object
    (such as Task, Note, ...).
    - Allowed: A ModelPrivilege entry is created when a new entity is created (with the current user)
    - Allowed: Users are allowed to edit ModelPrivileges only if they are the owner of the related object
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """

    # skip raw inserts
    if kwargs.get('raw'):
        return

    # verify whether permission checks are enabled
    if permission_checks_disabled(instance):
        return

    # verify whether there are already model privileges for the current content_object
    if not ModelPrivilege.objects.filter(
            content_type=instance.content_type,
            object_id=instance.object_id
    ).exists():
        # no model privilege exists for the given content_type and object_id
        return

    user = get_current_user()

    if user.is_superuser:
        return

    if user.is_anonymous:
        raise PermissionDenied

    # verify whether the current user is an owner of the given content_type and object_id
    if not ModelPrivilege.objects.filter(
            content_type=instance.content_type,
            object_id=instance.object_id,
            user=user,
            full_access_privilege=ModelPrivilege.ALLOW,
    ).exists():
        raise PermissionDenied


@receiver(pre_save, sender=ModelPrivilege)
def disallow_change_of_last_full_access_privilege(instance, *args, **kwargs):
    """
    Validates that the current content object has at least one user that has full access
    :return:
    """
    existing_model_privilege = ModelPrivilege.objects.filter(pk=instance.pk).first()

    # check if the instance already exists
    if not existing_model_privilege:
        return

    if existing_model_privilege.full_access_privilege != ModelPrivilege.ALLOW:
        return

    if ModelPrivilege.objects.exclude(id=instance.id).filter(
            content_type=instance.content_type,
            object_id=instance.object_id,
            full_access_privilege=ModelPrivilege.ALLOW
    ).count() > 0:
        # someone else is owner -> okay
        return

    # else: we are trying to delete the last owner -> not allowed
    raise ValidationError({
        'full_access_privilege': ValidationError(
            _("There must be at least one user that has full_access_privilege of this entity"),
            params={'full_access_privilege': instance.full_access_privilege},
            code='invalid'
        )
    })


@receiver(post_delete, sender=ModelPrivilege)
def disallow_delete_of_last_full_access_privilege(instance, *args, **kwargs):
    """
    Validates that a model privilege can only be deleted if it is not the last user with full access
    :return:
    """
    if not instance.content_object:
        return

    # allow deleting model privilege if the underlying content object has already been soft deleted
    # CalendarAccess has no attribute 'deleted', so we except the AttributeError and just log it here
    try:
        if instance.content_object.deleted:
            return
    except AttributeError as error:
        logger.info("In disallow_delete_of_last_full_access_privilege: {}".format(error))

    if instance.full_access_privilege != ModelPrivilege.ALLOW:
        return

    if ModelPrivilege.objects.exclude(id=instance.id).filter(
            content_type=instance.content_type,
            object_id=instance.object_id,
            full_access_privilege=ModelPrivilege.ALLOW
    ).count() > 0:
        # someone else is owner -> okay
        return

    # else: we are trying to delete the last owner -> not allowed
    raise ValidationError({
        'full_access_privilege': ValidationError(
            _("There must be at least one user that has full_access_privilege of this entity"),
            params={'full_access_privilege': instance.full_access_privilege},
            code='invalid'
        )
    })


@receiver(post_save)
def auto_create_owner_entity_permission(instance, created, *args, **kwargs):
    """
    Automatically creates an entity permission assignment with "is_owner = True" for a given entity,
    if "can_have_special_permissions = True" is set for the model
    :return:
    """
    # ignore raw inserts (e.g. from fixtures) and updates (not created)
    if kwargs.get('raw') or not created:
        return

    # ignore elements that do not have can_have_special_permissions
    if not hasattr(instance._meta, "can_have_special_permissions"):
        return

    # ignore can_have_special_permissions = False
    if not instance._meta.can_have_special_permissions:
        return

    current_user = get_current_user()

    if not current_user or current_user.is_anonymous:
        logger.warning("In auto_create_owner_entity_permission: current_user is anonymous, "
                       "not creating entity permission assignment")
        return

    # now can_have_special_permissions = True, and we need to create the assignment
    ModelPrivilege.objects.create(
        user=current_user,
        full_access_privilege=ModelPrivilege.ALLOW,
        content_object=instance
    )


@receiver(pre_save, sender=ModelPrivilege)
def fix_privileges(instance, *args, **kwargs):
    # Check if the privileges are correct and fix them if they are not. We start checking them from the
    # right side and fix privilege based on the "highest" allowed privilege in the following order:
    # restore > trash > edit > view
    if instance.restore_privilege == ModelPrivilege.ALLOW:
        instance.view_privilege = ModelPrivilege.ALLOW
        instance.edit_privilege = ModelPrivilege.ALLOW
        instance.trash_privilege = ModelPrivilege.ALLOW
    elif instance.trash_privilege == ModelPrivilege.ALLOW:
        instance.view_privilege = ModelPrivilege.ALLOW
        instance.edit_privilege = ModelPrivilege.ALLOW
    elif instance.edit_privilege == ModelPrivilege.ALLOW:
        instance.view_privilege = ModelPrivilege.ALLOW

    # Now, we must also check the denied privileges. We start checking them from the left side and fix
    # privilege based on the "lowest" denied privilege in the following order:
    # view > edit > trash > restore
    if instance.view_privilege == ModelPrivilege.DENY:
        instance.edit_privilege = ModelPrivilege.DENY
        instance.trash_privilege = ModelPrivilege.DENY
        instance.restore_privilege = ModelPrivilege.DENY
    elif instance.edit_privilege == ModelPrivilege.DENY:
        instance.trash_privilege = ModelPrivilege.DENY
        instance.restore_privilege = ModelPrivilege.DENY
    elif instance.trash_privilege == ModelPrivilege.DENY:
        instance.restore_privilege = ModelPrivilege.DENY
