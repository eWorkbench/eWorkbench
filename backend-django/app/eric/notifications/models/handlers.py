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
from eric.notifications.utils import is_user_notification_allowed, send_mail
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
            all_notification_keys = [key for key, label in NotificationConfiguration.NOTIFICATION_CONF_CHOICES]
            NotificationConfiguration.objects.get_or_create(
                user=user,
                defaults={
                    'allowed_notifications': all_notification_keys
                }
            )


@receiver(post_save, sender=Meeting)
def send_confirmation_mail_for_new_appointment(sender, instance, created, raw, *args, **kwargs):
    is_fixture = raw
    is_update = not created

    if is_fixture or is_update:
        return

    user = get_current_user()
    if is_user_notification_allowed(user, NotificationConfiguration.MAIL_CONF_MEETING_CONFIRMATION):
        html_message = render_to_string('notification/appointment_confirmation.html', context={
            'instance': instance,
        })

        # convert User to MyUser, so the full name is rendered (from the userprofile)
        user.__class__ = MyUser

        subject = _('Confirmation for {appointment_title}').format(appointment_title=instance.title)
        context = {
            'title': subject,
            'message': html_message,
            'user': str(user),
        }
        html_content = render_to_string('email/simple_email.html', context)
        plaintext_content = render_to_string('email/simple_email.txt', context)

        send_mail(
            subject=subject,
            message=plaintext_content,
            to_email=user.email,
            html_message=html_content,
        )


@receiver(post_save, sender=Meeting)
def create_notification_based_on_meeting_changes(sender, instance, *args, **kwargs):
    """Notifies the user that something has changed in the meeting"""
    if get_current_user().is_anonymous:
        return

    # save the instance here before the refresh, so it can be used to determine the date_time_start
    # for scheduled notifications
    to_be_saved_instance = instance

    # refresh meeting from DB
    instance = Meeting.objects.prefetch_common().get(pk=instance.pk)

    # if there's a ScheduledNotification related to this meeting,
    # it's deletion-status needs to be updated based on the meeting's status
    try:
        scheduled_notification = ScheduledNotification.objects.get(object_id=instance.pk)
        # Don't send reminder notifications if the to_be_saved meeting date_time_start is already in the past
        if scheduled_notification and to_be_saved_instance.local_date_time_start > timezone.now():
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
        context = {
            'user': attended_user,
            'instance': instance
        }
        html_message = render_to_string('notification/meeting_changed.html', context)

        Notification.objects.update_or_create(
            user=attended_user,
            content_type=instance.get_content_type(),
            object_id=instance.pk,
            read=False,
            sent__isnull=True,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_CHANGED,
            created_by=get_current_user(),
            created_at__gte=timezone.now() - timedelta(seconds=60),
            defaults={
                'title': _("Appointment {title} has changed").format(title=instance.title),
                'message': html_message,
                'created_at': timezone.now()
            }
        )


@receiver(post_save, sender=UserAttendsMeeting)
def create_notification_based_on_add_user_to_meeting(sender, instance, *args, **kwargs):
    """Notifies the attended user that he was added to the meeting"""
    if get_current_user().is_anonymous:
        return

    attended_user = instance.user
    if attended_user != get_current_user():
        meeting = Meeting.objects.get(pk=instance.meeting.pk)

        context = {
            'user': attended_user,
            'instance': meeting
        }
        html_message = render_to_string('notification/meeting_add_user.html', context)

        Notification.objects.create(
            user=attended_user,
            title=_("You have been added to meeting {meeting}").format(meeting=meeting.title),
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

        context = {
            'user': attended_user,
            'instance': meeting
        }
        html_message = render_to_string('notification/meeting_remove_user.html', context)

        Notification.objects.create(
            user=attended_user,
            title=_("You have been removed from meeting {meeting}").format(meeting=meeting.title),
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
        context = {
            'user': assigned_user,
            'instance': instance
        }
        html_message = render_to_string('notification/task_changed.html', context)

        # check if a notification for this task and the assigned user has already been created by the current user
        # within the last 60 secs and if it is unread
        Notification.objects.update_or_create(
            user=assigned_user,
            content_type=instance.get_content_type(),
            object_id=instance.pk,
            read=False,
            sent__isnull=True,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_TASK_CHANGED,
            created_by=get_current_user(),
            created_at__gte=timezone.now() - timedelta(seconds=60),
            defaults={
                'title': _("Task {title} has changed".format(title=instance.title)),
                'message': html_message,
                'created_at': timezone.now(),
            }
        )


@receiver(post_save, sender=TaskAssignedUser)
def create_notification_based_on_add_user_to_task(sender, instance, *args, **kwargs):
    """Notifies the assigned user that he was added to the task"""
    if get_current_user().is_anonymous:
        return

    assigned_user = instance.assigned_user

    if assigned_user != get_current_user():
        task = Task.objects.get(pk=instance.task.pk)

        context = {
            'user': assigned_user,
            'instance': task
        }
        html_message = render_to_string('notification/task_add_user.html', context)

        Notification.objects.create(
            user=assigned_user,
            title=_("You have been added to task {task}").format(task=task.title),
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

        context = {
            'user': assigned_user,
            'instance': task
        }
        html_message = render_to_string('notification/task_remove_user.html', context)

        Notification.objects.create(
            user=assigned_user,
            title=_("You have been removed from task {task}").format(task=task.title),
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
    ).exclude(
        user=get_current_user()
    )

    for assigned_user in assigned_users:
        context = {
            'user': assigned_user.user,
            'instance': instance
        }
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

        if created:  # user was added to the project
            # verify that the user role has access to the project
            if not instance.role.permissions.filter(
                    codename='view_project',
                    content_type=Project.get_content_type()
            ).exists():
                # this role does not have view_project, so we are not sending a notification
                return

            html_message = render_to_string('notification/project_add_user.html', context)
            title = _("You have been added to project {project}").format(project=project.name)

        else:  # user role has changed
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

        # render html message
        context = {
            'user': assigned_user,
            'instance': project
        }
        html_message = render_to_string('notification/project_remove_user.html', context)

        Notification.objects.create(
            user=assigned_user,
            title=_("You have been removed from project {project}").format(project=project.name),
            message=html_message,
            content_type=project.get_content_type(),
            object_id=project.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_PROJECT_USER_CHANGED
        )


@receiver(post_save, sender=Relation)
def create_notification_based_on_add_relation(sender, instance, *args, **kwargs):
    if get_current_user().is_anonymous:
        return

    create_notification_based_on_relation(instance, added=True)


@receiver(post_delete, sender=Relation)
def create_notification_based_on_delete_relation(sender, instance, *args, **kwargs):
    create_notification_based_on_relation(instance, added=False)


def create_notification_based_on_relation(instance, added):
    """ Creates notifications for new/removed links on tasks and meetings """

    # do not create notifications for private relations
    if instance.private:
        return

    left = instance.left_content_object
    right = instance.right_content_object

    create_notification_for_link_change(added, base_object=right, related_object=left)
    create_notification_for_link_change(added, base_object=left, related_object=right)


def create_notification_for_link_change(added, base_object, related_object):
    if isinstance(base_object, Meeting):
        assigned_users = base_object.attending_users
        notification_type = NotificationConfiguration.NOTIFICATION_CONF_MEETING_RELATION_CHANGED
        if added:
            html_path = 'notification/meeting_add_relation.html'
            title = _("A new link was added for the appointment {title}").format(title=base_object.title)
        else:
            html_path = 'notification/meeting_remove_relation.html'
            title = _("Link was removed from the appointment {title}").format(title=base_object.title)
    elif isinstance(base_object, Task):
        assigned_users = base_object.assigned_users
        notification_type = NotificationConfiguration.NOTIFICATION_CONF_TASK_RELATION_CHANGED
        if added:
            html_path = 'notification/task_add_relation.html'
            title = _("A new link was added for the task {title}").format(title=base_object.title)
        else:
            html_path = 'notification/meeting_remove_relation.html'
            title = _("Link was removed from the task {title}").format(title=base_object.title)
    else:
        return

    users_to_notify = assigned_users.exclude(pk=get_current_user().pk)
    for user in users_to_notify:
        context = {
            'user': user,
            'instance': base_object,
            'related_object': related_object
        }

        Notification.objects.create(
            user=user,
            title=title,
            message=render_to_string(html_path, context),
            content_type=base_object.get_content_type(),
            object_id=base_object.pk,
            notification_type=notification_type
        )
