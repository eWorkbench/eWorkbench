#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import BaseCommand
from django.db.models import Subquery
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.timezone import timedelta, localtime
from django.utils.translation import gettext as _

from eric.core.templatetags.date_filters import date_short
from eric.notifications.config import MINIMUM_TIME_BETWEEN_EMAILS, SINGLE_MAIL_NOTIFICATIONS
from eric.notifications.models import Notification, ScheduledNotification, NotificationConfiguration
from eric.notifications.utils import send_mail, is_user_notification_allowed
from eric.shared_elements.models import Meeting, Task
from eric.site_preferences.models import options as site_preferences

User = get_user_model()
LOGGER = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Sends unprocessed notifications'

    def handle(self, *args, **options):
        self.process_scheduled_notifications()
        self.process_task_reminders()

        users_that_recently_received_notifications = Notification.objects.filter(
            processed=True,
            sent__gte=timezone.now() - MINIMUM_TIME_BETWEEN_EMAILS
        ).values('user__pk')

        # get all notifications by active users that have not been processed and not been sent yet
        notifications = Notification.objects.filter(
            sent__isnull=True,
            processed=False,
            user__is_active=True
        ).exclude(
            user__in=Subquery(users_that_recently_received_notifications)
        ).prefetch_related(
            'user',
            'user__userprofile',
            'user__notification_configuration',
            'created_by',
            'created_by__userprofile'
        )

        notification_count = notifications.count()
        if notification_count > 0:
            self.aggregate_and_send_notifications(notifications, notification_count)

    @staticmethod
    def send_mail_to_contact(title, contact, html_message):
        context = {
            'title': title,
            'message': html_message,
            'user': f'{contact.first_name} {contact.last_name}',
            'workbench_title': site_preferences.site_name
        }
        html = render_to_string('email/single_notification_email.html', context)
        plaintext = render_to_string('email/single_notification_email.txt', context)
        try:
            send_mail(subject=title, message=plaintext, to_email=contact.email, html_message=html)
        except Exception as exc:
            LOGGER.exception(exc)

    @classmethod
    def process_task_reminders(cls):
        now = timezone.now()
        tasks = Task.objects.filter(
            remind_assignees=True,
            reminder_datetime__lte=now + timedelta(seconds=60),
            reminder_datetime__gte=now - timedelta(seconds=60),
        )
        for task in tasks:
            assigned_users = task.assigned_users.all()
            title = _(f"Reminder: Task {task.title}")
            html_message = render_to_string('notification/task_reminder.html', {'instance': task})
            for assigned_user in assigned_users:
                Notification.objects.get_or_create(
                    user=assigned_user,
                    content_type=task.get_content_type(),
                    object_id=task.pk,
                    notification_type=NotificationConfiguration.NOTIFICATION_CONF_TASK_REMINDER,
                    created_at__gte=now - timedelta(seconds=90),
                    defaults={
                        'title': title,
                        'message': html_message,
                        'created_at': now
                    }
                )

    @classmethod
    def process_scheduled_notifications(cls):
        scheduled_notifications = ScheduledNotification.objects.filter(
            processed=False,
            scheduled_date_time__lte=timezone.now(),
            deleted=False,
            active=True
        )

        for scheduled_notification in scheduled_notifications:
            meeting = Meeting.objects.prefetch_common().get(pk=scheduled_notification.object_id)

            # only send reminders for meetings that are still in the future
            if meeting.local_date_time_start > timezone.now():
                attending_users = meeting.attending_users.all()
                attending_contacts = meeting.attending_contacts.all()
                title = _("Reminder: Appointment {title} starts at {date_time_start}".format(
                    title=meeting.title,
                    date_time_start=date_short(meeting.local_date_time_start)
                ))
                html_message = render_to_string('notification/meeting_reminder.html', {'instance': meeting})

                for attending_user in attending_users:
                    Notification.objects.update_or_create(
                        user=attending_user,
                        content_type=meeting.get_content_type(),
                        object_id=meeting.pk,
                        read=False,
                        sent__isnull=True,
                        notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_REMINDER,
                        created_at__gte=timezone.now() - timedelta(seconds=60),
                        defaults={
                            'title': title,
                            'message': html_message,
                            'created_at': timezone.now()
                        }
                    )

                for contact in attending_contacts:
                    if contact.email:
                        cls.send_mail_to_contact(title, contact, html_message)

        scheduled_notifications.update(processed=True)

    @staticmethod
    def send_single_notification_to_user(user, notification):
        """ Sends a single notification to the provided user """
        context = {
            'title': notification.title,
            'message': notification.message,
            'user': str(user),
            'workbench_url': settings.WORKBENCH_SETTINGS['url'],
            'workbench_title': site_preferences.site_name,
            'notification': notification
        }
        html = render_to_string('email/single_notification_email.html', context)
        plaintext = render_to_string('email/single_notification_email.txt', context)
        send_mail(subject=notification.title, message=plaintext, html_message=html, to_email=user.email)

    @staticmethod
    def send_multiple_notifications_to_user(user, notifications):
        context = {
            'user': str(user),
            'notifications': notifications,
            'workbench_url': settings.WORKBENCH_SETTINGS['url'],
            'workbench_title': site_preferences.site_name
        }
        html = render_to_string('email/multiple_notifications_email.html', context)
        plaintext = render_to_string('email/multiple_notifications_email.txt', context)
        send_mail(subject=_('Multiple notifications'), message=plaintext, to_email=user.email, html_message=html)

    @classmethod
    def aggregate_and_send_notifications(cls, notifications_qs, notification_count):
        notifications_by_user, users_by_pk = cls.aggregate_notifications_and_users(notifications_qs)

        if notification_count > 0:
            print("[{datetime}] Processing {num_notifications} notifications for {num_users} users".format(
                num_notifications=notification_count,
                datetime=timezone.now().isoformat(),
                num_users=len(notifications_by_user.keys()),
            ))

        # update all notifications, mark them as processed
        notifications_qs.update(processed=True)

        for user_pk in notifications_by_user.keys():
            user = users_by_pk[user_pk]
            user_notifications = notifications_by_user[user_pk]
            notification_pk_list = []

            # process single notifications
            single_notifications = [
                notification for notification in user_notifications
                if notification.notification_type in SINGLE_MAIL_NOTIFICATIONS
            ]
            for notification in single_notifications:
                cls.send_single_notification_to_user(user, notification)
                notification_pk_list.append(notification.pk)
                user_notifications.remove(notification)

            # process normal notifications
            if len(user_notifications) == 1:
                # only one notification -> send notification with full details to the user
                cls.send_single_notification_to_user(user, user_notifications[0])
                notification_pk_list.append(user_notifications[0].pk)
            elif len(user_notifications) > 1:
                # multiple notifications -> compile a message with aggregated notifications
                cls.send_multiple_notifications_to_user(user, user_notifications)
                for notification in user_notifications:
                    notification_pk_list.append(notification.pk)

            # update 'sent' attribute of the processed notifications
            Notification.objects.filter(pk__in=notification_pk_list).update(sent=timezone.now())

    @staticmethod
    def aggregate_notifications_and_users(notifications_qs):
        notifications_by_user = {}
        users_by_pk = {}

        for notification in notifications_qs:
            user = notification.user

            if user.pk not in notifications_by_user:
                notifications_by_user[user.pk] = []
                users_by_pk[user.pk] = user

            if is_user_notification_allowed(user, notification.notification_type):
                notifications_by_user[user.pk].append(notification)

        return notifications_by_user, users_by_pk
