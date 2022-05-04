#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains the handlers for eric.projects"""
import logging
import uuid

import django.dispatch
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied
from django.db import transaction
from django.db.models import Q
from django.db.models.signals import post_save, pre_save, pre_delete, m2m_changed, post_delete
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django_changeset.models import ChangeSet, ChangeRecord
from django_rest_multitokenauth.signals import post_auth
from django_userforeignkey.request import get_current_user, get_current_request

from eric.core.models import LockMixin, permission_checks_disabled, disable_permission_checks
from eric.core.models.abstract import SoftDeleteMixin
from eric.core.models.utils import get_permission_name
from eric.notifications.models import NotificationConfiguration, Notification
from eric.projects.models import Project, ProjectRoleUserAssignment, Role, ElementLock
from eric.projects.models import UserStorageLimit, MyUser
from eric.relations.models import Relation
from eric.shared_elements.models import Metadata, Comment, File
from eric.site_preferences.models import options as site_preferences

logger = logging.getLogger('eric.projects.models.handlers')

check_create_roles_for_other_workbench_elements = django.dispatch.Signal(
    providing_args=["user", "instance"]
)


@receiver(pre_save, sender=ProjectRoleUserAssignment)
def prevent_update_of_last_project_manager(sender, instance, *args, **kwargs):
    """
    For each project there must be at least one project manager
    This pre_save handler prevents that the last project manager is being demoted
    """
    if permission_checks_disabled(instance):
        return

    if instance.pk:
        obj = ProjectRoleUserAssignment.objects.filter(pk=instance.pk).first()
        if obj and not obj.is_deleteable():
            raise ValidationError({
                'non_field_errors': ValidationError(
                    _("The last project manager of this project can not be removed"),
                    params={'assignment': instance},
                    code='invalid'
                )
            })


@receiver(pre_delete, sender=ProjectRoleUserAssignment)
def prevent_delete_of_project_manager(sender, instance, *args, **kwargs):
    """
    For each project there must be at least one project manager
    This pre_delete handler prevents deletion of the last project manager for a given project
    """
    if permission_checks_disabled(instance):
        return

    if hasattr(instance, 'is_deleteable') and not instance.is_deleteable():
        raise ValidationError({
            'non_field_errors': ValidationError(
                _("The last project manager of this project can not be removed"),
                params={'assignment': instance},
                code='invalid'
            )
        })


def raise_error_if_object_not_soft_deleted(sender, instance, *args, **kwargs):
    """
    Raises a validation error if the given instance is not yet soft deleted
    :param sender:
    :param instance: SoftDeleteMixin
    :param args:
    :param kwargs:
    :return:
    """
    # make sure the instance is soft deletable (ensures that instance.deleted can be accessed)
    if isinstance(instance, SoftDeleteMixin):
        # check if the instance has been soft deleted
        if not instance.deleted:
            raise ValidationError({
                'non_field_errors': ValidationError(
                    _("This instance can not be deleted, as it needs to be trashed first"),
                    params={'instance': instance},
                    code='invalid'
                )
            })


@receiver(pre_delete)
def check_delete_roles(sender, instance, *args, **kwargs):
    """
    On pre_delete, check delete permission for every database object where the queryset implements "deletable"
    raises a PermissionDenied exception on error
    """
    if isinstance(instance, Metadata):
        # deleting meta data is fine
        return

    if permission_checks_disabled(instance):
        return

    # ensure that the object has been soft deleted already, else raise an exception
    raise_error_if_object_not_soft_deleted(sender, instance, *args, **kwargs)

    user = get_current_user()

    # check if user has global delete permission for this class
    if user.has_perm(get_permission_name(instance.__class__, 'delete')):
        return

    mng = instance.__class__.objects

    # check if deletable exists and the instance.pk is in the deletable queryset
    if hasattr(mng, "deletable") and callable(mng.deletable) and mng.deletable().filter(pk=instance.pk).count() == 0:
        raise PermissionDenied


def check_create_roles_for_parent_project(user, sender, instance, *args, **kwargs):
    """
    If a project is created (or the parent_project property is changed), we need to check if the current user has
    permissions to do that
    E.g., as a project member, you are usually not allowed to create a sub-project
    However, as a project manager, you are allowed to do that
    :param user:
    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    with transaction.atomic():
        Project.objects.rebuild()
    # the user is already logged in and does not have the global permission to create something, therefore we need
    # to check the add_project permissions of instance.parent_project
    if not hasattr(instance, 'parent_project'):
        return

    if not instance.parent_project:
        return

    # get parent project from the provided instance
    parent_project = instance.parent_project

    # get the current project (it might not exist yet)
    current_project = Project.objects.filter(pk=instance.pk).first()

    # check if this is an existing project
    if current_project:
        # Check if parent_project has changed
        old_parent_project = current_project.parent_project

        if parent_project == old_parent_project:
            # nothing changed, ignoring
            return

        # Check if current user has the change_parent_project permission on the current project
        if not get_permission_name(
                instance.__class__, 'change_parent'
        ) in instance.current_users_project_permissions_list:
            raise ValidationError({
                'parent_project': ValidationError(
                    _('You are not allowed to change the parent project'),
                    params={'project': parent_project},
                    code='invalid'
                )
            })

    # check if current user has the add_project permission on the parent_project
    if not get_permission_name(
            instance.__class__, 'add'
    ) in parent_project.current_users_project_permissions_list:
        # user is not allowed to create this entity without relating it to a project
        # You do not have permissions to create a new task without selecting a project
        raise ValidationError({
            'parent_project': ValidationError(
                _('You are not allowed to select this project'),
                params={'project': parent_project},
                code='invalid'
            )
        })


def check_create_roles(sender, instance, *args, **kwargs):
    """
    Check if the current user is allowed to create an object (which can be related to a project)
    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    user = get_current_user()

    if not user.pk or user.is_anonymous:
        return

    # check for global create permission of this object class
    if user.has_perm(get_permission_name(instance.__class__, 'add')):
        if type(instance) == Project:
            check_create_roles_for_parent_project(user, sender, instance, *args, **kwargs)
        return
    else:
        # user does not have global permission, check if the user is trying to create a project
        if type(instance) == Project:
            # user does not have the add_project permission
            raise PermissionDenied

    # check if this the instance is related to projects
    if not hasattr(instance, 'projects'):
        # not project related,
        # several workbench elements, such as meetings, kanban boards, labbooks etc... can deny creating related
        # objects (such as kanban board columns, labbook elements, ...)
        # We delegate this check to another signal

        check_create_roles_for_other_workbench_elements.send(sender=sender, instance=instance, user=user)

        # This signal used to be the following call:
        # if hasattr(instance, 'meeting'):
        #     check_create_roles_for_meeting(user, sender, instance, *args, **kwargs)
        # elif hasattr(instance, 'kanban_board'):
        #     check_create_roles_for_kanbanboard(user, sender, instance, *args, **kwargs)
        # elif hasattr(instance, 'Kanban_board_column'):
        #     check_create_roles_for_kanbanboard_column(user, sender, instance, *args, **kwargs)

    # last but not least, check if this is related to the Project Model and has a parent_project
    if hasattr(instance, 'parent_project'):
        check_create_roles_for_parent_project(user, sender, instance, *args, **kwargs)


@receiver(m2m_changed)
def check_workbench_element_relation_with_projects(sender, instance, action, model, *args, **kwargs):
    """
    Each workbench element can be related to many projects (hence m2m_changed). Relations with projects are important,
    as users have roles in projects, and those roles provide permissions on the elements within a project.

    Therefore, everytime this relation changes (action = add or remove), we need to verify that the current user is
    actually allowed to change it

    :param sender:
    :param instance: BaseModel
    :param action:
    :param args:
    :param kwargs:
    :return:
    """

    # do not handle raw inserts, or ChangeSet or ChangeRecord insert - those are always allowed
    if kwargs.get('raw') or isinstance(instance, ChangeSet) or isinstance(instance, ChangeRecord):
        return

    # check if disablePermissionChecks is currently set for this class
    if permission_checks_disabled(instance):
        return

    # check if the instance is actually related to projects
    if not hasattr(instance, 'projects'):
        # not related, ignore
        return

    # only handle pre_add and pre_remove actions
    if action != 'pre_add' and action != 'pre_remove':
        return

    # this handler only checks for projects
    if model != Project:
        return

    # We temporarily must deactivate all permission checks for files because of SITUMEWB-819
    if instance.__class__ == File:
        return

    user = get_current_user()

    # first of all, check if the object is editable by the current user
    if hasattr(instance, 'is_editable') and not instance.is_editable():
        raise PermissionDenied

    # on both actions (pre_add and pre_remove), we can get the set of primary keys that is affected from kwargs
    project_pk_set = kwargs.get('pk_set')
    # get all viewable projects of this primary key set, a newly generated cache_id is added to the request in order
    # to fetch a fresh result from the DB, instead of a cached result
    projects = Project.objects.viewable(cache_id=uuid.uuid4()).filter(pk__in=project_pk_set)

    # TODO: We must change the following permission checks as we run into several logic errors all the time.
    # We don't need to check if the user has specific permissions on all linked projects. It's satisfying enough to have
    # specific permissions on only one linked project as it overrules all the other ones.
    #
    # The problem of running into permission errors occurs if e.g. a user uploads a file to a storage which inherits
    # permissions from multiple projects. Although permission checks are disabled they can still throw PermissionDenied
    # errors if you link more than one project or use a parent/child project. Use this setup to reproduce this behavior:
    #
    # Project A by User A -> set User B as Observer
    # Project B by User A (Project A is the parent project for Project B) -> set User B as Project Member
    # Storage A by User A with linked projects Project A and Project B -> User B can't upload although he should be able
    # to because he is Project Member in Project B but not in Project A.

    if action == 'pre_add':
        # pre add: verify that the user has the permission to create a new instance of within the projects
        if user.has_perm(get_permission_name(instance.__class__, 'add')):
            return

        # for each project, verify that we have add roles
        for project in projects:
            if not get_permission_name(instance.__class__, 'add') in project.current_users_project_permissions_list:
                raise PermissionDenied
    elif action == 'pre_remove':
        # pre remove: verify that the user is allowed to remove an instance within the projects
        if user.has_perm(get_permission_name(instance.__class__, 'delete')):
            return

        # for each project, verify that we have remove roles
        for project in projects:
            if not get_permission_name(instance.__class__, 'delete') in project.current_users_project_permissions_list:
                raise PermissionDenied


@receiver(pre_save, sender=Project)
def check_update_project_parent_project(instance, *args, **kwargs):
    """
    Checks whether the current user is allowed to change the parent project of the given project instance
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    # do not check for raw inserts or ChangeSet or ChangeRecord insert - those are always allowed
    if kwargs.get('raw') or isinstance(instance, ChangeSet) or isinstance(instance, ChangeRecord):
        return

    if permission_checks_disabled(instance):
        return

    mng = instance.__class__.objects

    # check if instance exists
    if mng.filter(pk=instance.pk).count() == 0:
        # new instance --> ignore (check_create_roles will handle that case)
        return

    # check whether the current user is allowed to do stuff with the current project
    # therefore we need to remove the original sender
    kwargs['original_sender'] = kwargs.pop('sender')
    check_create_roles_for_parent_project(get_current_user(), Project, instance, *args, **kwargs)


def check_soft_delete_and_restore_roles(mng, instance, old_instance):
    """
    Checks for soft delete and trash roles of the provided instance
    :param instance: SoftDeleteMixin
    """
    user = get_current_user()

    # find out whether this is a restore or trash operation

    if old_instance.deleted:
        assert instance.deleted is False
        # restore instance

        # check if user has global restore permission
        if user.has_perm(get_permission_name(instance.__class__, 'restore')):
            return

        # check if object is restorable according to the objects manager
        if hasattr(instance, 'is_restorable') and not instance.is_restorable():
            raise PermissionDenied

    else:
        assert instance.deleted is True
        # trash instance

        # check if user has global trash permission
        if user.has_perm(get_permission_name(instance.__class__, 'trash')):
            return

        # check if object is trashable according to the objects manager
        if hasattr(instance, 'is_trashable') and not instance.is_trashable():
            raise PermissionDenied


@receiver(pre_save)
def check_update_roles(sender, instance, *args, **kwargs):
    """
    Check update permission for each database object where the queryset implements "changeable"
    raises a PermissionDenied exception on error
    """
    # do not check for raw inserts or ChangeSet or ChangeRecord insert - those are always allowed
    if kwargs.get('raw') or isinstance(instance, ChangeSet) or isinstance(instance, ChangeRecord) \
            or isinstance(instance, Metadata):
        return

    if permission_checks_disabled(instance):
        return

    mng = instance.__class__.objects

    # get the existing instance (if it exists)
    old_instance = mng.filter(pk=instance.pk).first()

    # check if instance exists
    if not old_instance:
        return check_create_roles(sender, instance, *args, **kwargs)

    if hasattr(instance, 'deleted'):
        # we need to do some checks for soft deleted objects
        # check if this instance is being soft deleted or restored
        if old_instance.deleted != instance.deleted:
            # delegate permission check to another function
            return check_soft_delete_and_restore_roles(mng, instance, old_instance)

        # prevent updates of soft-deleted (trashed) objects
        if instance.deleted:
            raise ValidationError({
                'non_field_errors': ValidationError(
                    _("You are not allowed to edit an already trashed object"),
                    params={'instance': instance},
                    code='invalid'
                )
            })

        # prevent updates of locked elements
        if ElementLock.objects.for_model(
                instance.__class__, instance.pk
        ).filter(
            Q(
                webdav_lock=False,
                locked_at__gte=timezone.now() - timezone.timedelta(
                    minutes=site_preferences.element_lock_time_in_minutes)
            ) | Q(
                webdav_lock=True,
                locked_at__gte=timezone.now() - timezone.timedelta(
                    minutes=site_preferences.element_lock_webdav_time_in_minutes)
            )
        ).exclude(
            # ignore if the element is locked by the current user
            locked_by=get_current_user()
        ).exists():
            # element is locked by another user
            raise ValidationError({
                'non_field_errors': ValidationError(
                    _("This object is currently locked by another user"),
                    params={'instance': instance},
                    code='invalid'
                )
            })

    # !!! from now on we know for sure that this is an update !!!

    # check if the user has global change roles
    user = get_current_user()

    if user.has_perm(get_permission_name(instance.__class__, 'change')):
        return

    # allow the user to edit if he was attending, so he can remove himself
    if hasattr(instance, 'attending_users') and user in instance.attending_users.all():
        logger.debug("In check_update_roles: User is attending so user is allowed to edit")
    else:
        # check if this instance is editable
        if hasattr(instance, 'is_editable') and not instance.is_editable():
            logger.debug("In check_update_roles: Checking editable() viewset - "
                         "could not find object -> PermissionDenied")
            raise PermissionDenied


@receiver(post_save, sender=Project)
def on_project_create_add_project_manager_role_for_current_user(sender, instance, created, *args, **kwargs):
    """
    When a new project is created, assign the role 'Project Manager' (default_role_on_project_create = True)
    to the current user
    """
    # ignore raw inserts (e.g. from fixtures) and updates (not created)
    if kwargs.get('raw') or not created:
        return

    from eric.core.models import disable_permission_checks

    # create a new project role user assignment for this user and the current project
    # we have to disable permission checks for this model temporarily
    with disable_permission_checks(ProjectRoleUserAssignment):
        assignment = ProjectRoleUserAssignment()
        assignment.user = get_current_user()
        assignment.project = instance
        assignment.role = Role.objects.filter(default_role_on_project_create=True).first()
        assignment.save()


@receiver(post_auth)
def auto_create_project_for_user(sender, user, *args, **kwargs):
    """
    On post_auth, automatically create a project on login (if the user does not have any)
    :param sender:
    :param user:
    :param args:
    :param kwargs:
    :return:
    """

    # set current requests user (as during auth, that user is not set yet)
    request = get_current_request()
    if request and (not hasattr(request, 'user') or request.user.is_anonymous):
        request.user = user

    if Project.objects.viewable().count() == 0:
        # no projects found, check if user has add_project permission
        if user.has_perm(get_permission_name(Project, 'add')):
            logger.info("Auto-creating project {project_name} for user {user_name}".format(
                project_name=_("My Project"),
                user_name=user.username
            ))
            Project.objects.create(
                name=_("My Project"),
                start_date=timezone.now(),
                description="<div>%s</div>" % _("Automatically generated project")
            )


@receiver(post_save)
def create_user_storage_limit(sender, instance, created, *args, **kwargs):
    """On post_save of a user, automatically create a storage limit for the user if it not exists."""
    if sender == get_user_model() or sender == MyUser:
        user = instance

        # only continue if the user has logged in at least once
        if user.last_login:
            # create user storage limit for the provided user instance in case it does not exist yet
            UserStorageLimit.objects.get_or_create(
                user=user,
                defaults={
                    'storage_megabyte': settings.DEFAULT_QUOTA_PER_USER_MEGABYTE,
                    'comment': _("Auto-generated (post_save) storage limit of {storage_limit} MB"
                                 .format(storage_limit=settings.DEFAULT_QUOTA_PER_USER_MEGABYTE))
                }
            )


@receiver(post_save)
def auto_create_element_lock(instance, *args, **kwargs):
    """
    :param eric.core.models.base.LockMixin instance:
    :param args:
    :param kwargs:
    :return:
    """
    if not isinstance(instance, LockMixin):
        return

    current_user = get_current_user()

    if not current_user or current_user.is_anonymous:
        # ignore calls without a user
        return

    instance.lock()


@receiver(post_save, sender=Project)
def update_project_cache_after_save(*args, **kwargs):
    """
    mptt rebuild the tree
    """
    with transaction.atomic():
        Project.objects.rebuild()


@receiver(post_delete, sender=Project)
def update_project_cache_after_delete(*args, **kwargs):
    """
    mptt rebuild the tree
    """
    with transaction.atomic():
        Project.objects.rebuild()


@receiver(post_save, sender=Project)
def populate_project_fts_parent_index(instance, *args, **kwargs):
    """
    Rewrites the FTS index for parents of projects.
    This happens recursively for the whole parent-tree as this function
    is subsequently called for the parents parent on updating the index
    This needs to happen post_save, since the current project wouldn't be
    registered by parent_project._get_search_vector(), as it isn't persisted
    if this would be triggered by a pre_save-receiver
    """

    # populate the project parent's FTS index with the `SearchVector` containing the
    # rendered search document
    with disable_permission_checks(Project):
        if instance.parent_project:
            instance.parent_project.fts_index = instance.parent_project._get_search_vector()
            instance.parent_project.save()


@receiver(post_save, sender=Relation)
def send_new_comment_notification_to_project_members(sender, instance, created, **kwargs):
    """
    When a new comment is created, send a notification to all other project members
    """

    # check if the left content type is a comment and the right content type is a project
    if instance.left_content_type != Comment.get_content_type() or \
       instance.right_content_type != Project.get_content_type():
        return

    # ignore raw inserts (e.g. from fixtures) and updates (not created)
    if kwargs.get('raw') or not created:
        return

    comment = instance.left_content_object
    project = instance.right_content_object
    project_assignments = ProjectRoleUserAssignment.objects.filter(project__pk=project.pk)

    # send notifications for all assignments
    for assignment in project_assignments:
        # If the user of the assignment is the comment creator then skip this iteration
        if assignment.user.pk == comment.created_by.pk:
            continue

        message = render_to_string('notification/project_comment.html', {
            'comment': comment,
            'project': project
        })

        Notification.objects.create(
            user=assignment.user,
            title=_(f"A new comment has been posted for {project.name}"),
            message=message,
            content_type=Project.get_content_type(),
            object_id=project.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_PROJECT_COMMENT,
        )
