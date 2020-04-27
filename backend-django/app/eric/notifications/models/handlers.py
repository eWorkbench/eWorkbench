#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.timezone import timedelta
from django.utils.translation import ugettext as _
from django_userforeignkey.request import get_current_user

from eric.notifications.models import Notification
from eric.notifications.models import NotificationConfiguration, ScheduledNotification
from eric.projects.models import MyUser
from eric.projects.models import Project, ProjectRoleUserAssignment
from eric.relations.models import Relation
from eric.shared_elements.models import Meeting, UserAttendsMeeting, Task, TaskAssignedUser


@receiver(post_save)
def create_notification_configuration(sender, instance, *args, **kwargs):
    """Automatically create notification configuration for the user if it not exists"""
    if sender == get_user_model() or sender == MyUser:
        user = instance
        # only validate if the user has logged in
        if user.last_login:
            NotificationConfiguration.objects.get_or_create(
                user=user,
                defaults={
                    'allowed_notifications': [
                        NotificationConfiguration.NOTIFICATION_CONF_MEETING_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_MEETING_RELATION_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_MEETING_USER_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_TASK_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_TASK_RELATION_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_TASK_USER_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_PROJECT_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_PROJECT_USER_CHANGED
                    ]
                }
            )


@receiver(post_save, sender=Meeting)
def create_notification_based_on_meeting_changes(sender, instance, *args, **kwargs):
    """Notifies the user that something has changed in the meeting"""
    if get_current_user().is_anonymous:
        return

    # refresh meeting from DB
    instance = Meeting.objects.prefetch_common().get(pk=instance.pk)

    # if there's a ScheduledNotification related to this meeting,
    # it's deletion-status needs to be updated based on the meeting's status
    try:
        scheduled_notification = ScheduledNotification.objects.get(object_id=instance.pk)
        if scheduled_notification:
            scheduled_notification.scheduled_date_time = ScheduledNotification.calculate_scheduled_date_time(
                scheduled_notification.timedelta_unit,
                scheduled_notification.timedelta_value,
                instance.date_time_start
            )
            scheduled_notification.deleted = instance.deleted
            # make sure the reminder is sent again after meeting details have changed
            scheduled_notification.processed = False
            scheduled_notification.save()
    except ScheduledNotification.DoesNotExist:
        pass

    attending_users = instance.attending_users.all().exclude(pk=get_current_user().pk)

    for attended_user in attending_users:
        # define attributes for the html message
        context = {
            'user': attended_user,
            'instance': instance
        }

        # render html message
        html_message = render_to_string('notification/meeting_changed.html', context)

        title = _("Meeting {title} has changed".format(title=instance.title))

        existing_notification = Notification.objects.filter(
            user=attended_user,
            content_type=instance.get_content_type(),
            object_id=instance.pk,
            read=False,
            sent__isnull=True,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_CHANGED,
            created_by=get_current_user(),
            created_at__gte=timezone.now() - timedelta(seconds=60)
        ).first()

        if existing_notification:
            # update existing notification
            existing_notification.title = title
            existing_notification.message = html_message
            existing_notification.created_at = timezone.now()
            existing_notification.save()
        else:
            Notification.objects.create(
                user=attended_user,
                title=title,
                message=html_message,
                content_type=instance.get_content_type(),
                object_id=instance.pk,
                notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_CHANGED
            )


@receiver(post_save, sender=UserAttendsMeeting)
def create_notification_based_on_add_user_to_meeting(sender, instance, *args, **kwargs):
    """Notifies the attended user that he was added to the meeting"""
    if get_current_user().is_anonymous:
        return

    attended_user = instance.user
    if attended_user != get_current_user():
        meeting = Meeting.objects.get(pk=instance.meeting.pk)

        # define attributes for the html message
        context = {
            'user': attended_user,
            'instance': meeting
        }

        # render html message
        html_message = render_to_string('notification/meeting_add_user.html', context)

        Notification.objects.create(
            user=attended_user,
            title=_("You have been added to meeting {meeting}"
                    .format(user=str(attended_user), meeting=meeting.title)),
            message=html_message,
            content_type=meeting.get_content_type(),
            object_id=meeting.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_USER_CHANGED,
        )


@receiver(post_delete, sender=UserAttendsMeeting)
def create_notification_based_on_delete_user_from_meeting(sender, instance, *args, **kwargs):
    """Notifies the attended user that he was removed from the meeting"""
    if get_current_user().is_anonymous:
        return

    attended_user = instance.user
    if attended_user != get_current_user():
        meeting = Meeting.objects.get(pk=instance.meeting.pk)

        # define attributes for the html message
        context = {
            'user': attended_user,
            'instance': meeting
        }

        # render html message
        html_message = render_to_string('notification/meeting_remove_user.html', context)

        Notification.objects.create(
            user=attended_user,
            title=_("You have been removed from meeting {meeting}"
                    .format(user=str(attended_user), meeting=meeting.title)),
            message=html_message,
            content_type=meeting.get_content_type(),
            object_id=meeting.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_USER_CHANGED,
        )


@receiver(post_save, sender=Task)
def create_notification_based_on_task_changes(sender, instance, *args, **kwargs):
    """Notifies the user that something has changed in the task"""
    if get_current_user().is_anonymous:
        return

    # refresh task from DB
    instance = Task.objects.prefetch_common().get(pk=instance.pk)

    assigned_users = instance.assigned_users.all().exclude(pk=get_current_user().pk)

    for assigned_user in assigned_users:
        # define attributes for the html message
        context = {
            'user': assigned_user,
            'instance': instance
        }

        # render html message
        html_message = render_to_string('notification/task_changed.html', context)

        title = _("Task {title} has changed".format(title=instance.title))

        # check if a notification for this task and the assigned user has already been created by the current user
        # within the last 60 secs and if it is unread
        existing_notification = Notification.objects.filter(
            user=assigned_user,
            content_type=instance.get_content_type(),
            object_id=instance.pk,
            read=False,
            sent__isnull=True,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_TASK_CHANGED,
            created_by=get_current_user(),
            created_at__gte=timezone.now() - timedelta(seconds=60)
        ).first()

        if existing_notification:
            # update existing notification
            existing_notification.title = title
            existing_notification.message = html_message
            existing_notification.created_at = timezone.now()
            existing_notification.save()
        else:
            Notification.objects.create(
                user=assigned_user,
                title=title,
                message=html_message,
                content_type=instance.get_content_type(),
                object_id=instance.pk,
                notification_type=NotificationConfiguration.NOTIFICATION_CONF_TASK_CHANGED
            )


@receiver(post_save, sender=TaskAssignedUser)
def create_notification_based_on_add_user_to_task(sender, instance, *args, **kwargs):
    """Notifies the assigned user that he was added to the task"""
    if get_current_user().is_anonymous:
        return

    assigned_user = instance.assigned_user

    if assigned_user != get_current_user():
        task = Task.objects.get(pk=instance.task.pk)

        # define attributes for the html message
        context = {
            'user': assigned_user,
            'instance': task
        }

        # render html message
        html_message = render_to_string('notification/task_add_user.html', context)

        Notification.objects.create(
            user=assigned_user,
            title=_("You have been added to task {task}".format(user=str(assigned_user), task=task.title)),
            message=html_message,
            content_type=task.get_content_type(),
            object_id=task.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_TASK_USER_CHANGED
        )


@receiver(post_delete, sender=TaskAssignedUser)
def create_notification_based_on_delete_user_from_task(sender, instance, *args, **kwargs):
    """Notifies the attended user that he was removed from the task"""
    if get_current_user().is_anonymous:
        return

    assigned_user = instance.assigned_user

    if assigned_user != get_current_user():
        task = Task.objects.get(pk=instance.task.pk)

        # define attributes for the html message
        context = {
            'user': assigned_user,
            'instance': task
        }

        # render html message
        html_message = render_to_string('notification/task_remove_user.html', context)

        Notification.objects.create(
            user=assigned_user,
            title=_("You have been removed from task {task}"
                    .format(user=str(assigned_user), task=task.title)),
            message=html_message,
            content_type=task.get_content_type(),
            object_id=task.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_TASK_USER_CHANGED
        )


@receiver(post_save, sender=Project)
def create_notification_based_on_project_changes(sender, instance, *args, **kwargs):
    """Notifies the user that something has changed in the project"""
    if get_current_user().is_anonymous:
        return

    assigned_users = instance.assigned_users_roles.filter(
        role__permissions__codename='view_project',
        role__permissions__content_type=Project.get_content_type()
    ).exclude(user=get_current_user())

    for assigned_user in assigned_users:
        # define attributes for the html message
        context = {
            'user': assigned_user.user,
            'instance': instance
        }

        # render html message
        html_message = render_to_string('notification/project_changed.html', context)

        Notification.objects.create(
            user=assigned_user.user,
            title=_("Project {name} has changed".format(name=instance.name)),
            message=html_message,
            content_type=instance.get_content_type(),
            object_id=instance.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_PROJECT_CHANGED
        )


@receiver(post_save, sender=ProjectRoleUserAssignment)
def create_notification_based_on_add_user_to_project(sender, instance, created, *args, **kwargs):
    """Notifies the assigned user that he was added to the project or the role changed"""
    if get_current_user().is_anonymous:
        return

    assigned_user = instance.user

    if assigned_user != get_current_user():
        project = instance.project

        # define attributes for the html message
        context = {
            'user': assigned_user,
            'instance': project,
            'new_role': instance.role.name
        }

        if created:
            # user was added to the project

            # verify that the user role has access to the project
            if not instance.role.permissions.filter(codename='view_project',
                                                    content_type=Project.get_content_type()).exists():
                # this role does not have view_project, so we are not sending a notification
                return

            # render html message
            html_message = render_to_string('notification/project_add_user.html', context)
            title = _("You have been added to project {project}"
                      .format(user=str(assigned_user), project=project.name))

        else:
            # user role has changed

            # render html message
            html_message = render_to_string('notification/project_change_user_role.html', context)
            title = _("Your role in project {project} has been changed to {role}".format(
                role=instance.role.name, project=project.name
            ))

        Notification.objects.create(
            user=assigned_user,
            title=title,
            message=html_message,
            content_type=project.get_content_type(),
            object_id=project.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_PROJECT_USER_CHANGED
        )


@receiver(post_delete, sender=ProjectRoleUserAssignment)
def create_notification_based_on_delete_user_from_project(sender, instance, *args, **kwargs):
    """Notifies the attended user that he was removed from the project"""
    if get_current_user().is_anonymous:
        return

    assigned_user = instance.user

    # check that the role of this instance has the view_project role
    if not instance.role.permissions.filter(codename='view_project', content_type=Project.get_content_type()).exists():
        # this role does not have view_project, so we are not sending a notification
        return

    if assigned_user != get_current_user():
        project = instance.project

        # define attributes for the html message
        context = {
            'user': assigned_user,
            'instance': project
        }

        # render html message
        html_message = render_to_string('notification/project_remove_user.html', context)

        Notification.objects.create(
            user=assigned_user,
            title=_("You have been removed from project {project}"
                    .format(user=str(assigned_user), project=project.name)),
            message=html_message,
            content_type=project.get_content_type(),
            object_id=project.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_PROJECT_USER_CHANGED
        )


@receiver(post_save, sender=Relation)
def create_notification_based_on_add_relation(sender, instance, *args, **kwargs):
    """Notifies the assigned user that a relation was added"""
    if get_current_user().is_anonymous:
        return

    # do not create notification when relation is private
    if instance.private:
        return

    create_relation_based_on_relation(instance, True)


@receiver(post_delete, sender=Relation)
def create_notification_based_on_delete_relation(sender, instance, *args, **kwargs):
    # do not create notification when relation is private
    if instance.private:
        return

    create_relation_based_on_relation(instance, False)


def create_relation_based_on_relation(instance, added):
    """"""
    assigned_users = []
    object = None

    # check right_content_object is whether an instance of Meeting or Task
    if isinstance(instance.right_content_object, Meeting):
        assigned_users = instance.right_content_object.attending_users.all().exclude(pk=get_current_user().pk)
        object = instance.right_content_object
        create_relation_notification(assigned_users, object, instance.left_content_object, added)

    elif isinstance(instance.right_content_object, Task):
        assigned_users = instance.right_content_object.assigned_users.all().exclude(pk=get_current_user().pk)
        object = instance.right_content_object
        create_relation_notification(assigned_users, object, instance.left_content_object, added)

    # check left_content_object is whether an instance of Meeting or Task
    if isinstance(instance.left_content_object, Meeting):
        assigned_users = instance.left_content_object.attending_users.all().exclude(pk=get_current_user().pk)
        object = instance.left_content_object
        create_relation_notification(assigned_users, object, instance.right_content_object, added)

    elif isinstance(instance.left_content_object, Task):
        assigned_users = instance.left_content_object.assigned_users.all().exclude(pk=get_current_user().pk)
        object = instance.left_content_object
        create_relation_notification(assigned_users, object, instance.right_content_object, added)


def create_relation_notification(users, object, related_object, added):
    """creates a notification whether it is a task or a meeting"""

    if isinstance(object, Meeting):
        notification_type = NotificationConfiguration.NOTIFICATION_CONF_MEETING_RELATION_CHANGED
        if added:
            html_path = 'notification/meeting_add_relation.html'
            title = _("A new link was added for the meeting {title}".format(title=object.title))
        else:
            html_path = 'notification/meeting_remove_relation.html'
            title = _("Link was removed from the meeting {title}".format(title=object.title))
    elif isinstance(object, Task):
        notification_type = NotificationConfiguration.NOTIFICATION_CONF_TASK_RELATION_CHANGED
        if added:
            html_path = 'notification/task_add_relation.html'
            title = _("A new link was added for the task {title}".format(title=object.title))
        else:
            html_path = 'notification/meeting_remove_relation.html'
            title = _("Link was removed from the meeting {title}".format(title=object.title))

    for user in users:
        context = {
            'user': user,
            'instance': object,
            'related_object': related_object
        }

        # render html message
        html_message = render_to_string(html_path, context)

        Notification.objects.create(
            user=user,
            title=title,
            message=html_message,
            content_type=object.get_content_type(),
            object_id=object.pk,
            notification_type=notification_type
        )
