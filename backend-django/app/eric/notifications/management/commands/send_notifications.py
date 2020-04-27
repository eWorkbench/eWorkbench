#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.core.management import BaseCommand
from django.db.models import Subquery
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.timezone import timedelta
from django.utils.translation import ugettext as _

from eric.notifications.models import Notification, ScheduledNotification, NotificationConfiguration
from eric.shared_elements.models import Meeting
from eric.site_preferences.models import options as site_preferences

User = get_user_model()


class Command(BaseCommand):
    help = 'send notifications'

    def create_notification(self, title, meeting, user, html_message):
        existing_notification = Notification.objects.filter(
            user=user,
            content_type=meeting.get_content_type(),
            object_id=meeting.pk,
            read=False,
            sent__isnull=True,
            notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_REMINDER,
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
                user=user,
                title=title,
                message=html_message,
                content_type=meeting.get_content_type(),
                object_id=meeting.pk,
                notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_REMINDER
            )

    def send_mail_to_contact(self, title, contact, html_message):
        context = {
            'title': title,
            'message': html_message,
            'user': '{first_name} {last_name}'.format(
                first_name=contact.first_name,
                last_name=contact.last_name),
            'workbench_title': site_preferences.site_name
        }

        # render email text
        email_html_message = render_to_string('email/single_notification_email.html', context)
        email_plaintext_message = render_to_string('email/single_notification_email.txt', context)

        msg = EmailMultiAlternatives(
            # title:
            "{site_name}: {title}".format(
                site_name=site_preferences.site_name,
                title=title,
            ),
            # message:
            email_plaintext_message,
            # from:
            site_preferences.email_from,
            # to:
            [contact.email]
        )
        msg.attach_alternative(email_html_message, "text/html")
        msg.send()

    def process_scheduled_notifications(self):
        scheduled_notifications = ScheduledNotification.objects.filter(
            processed=False,
            scheduled_date_time__lte=timezone.now(),
            deleted=False,
            active=True
        )

        for scheduled_notification in scheduled_notifications:
            meeting = Meeting.objects.prefetch_common().get(pk=scheduled_notification.object_id)

            attending_users = meeting.attending_users.all()
            attending_contacts = meeting.attending_contacts.all()
            title = _("Reminder: Meeting {title} starts at {date_time_start}".format(
                title=meeting.title,
                date_time_start=meeting.date_time_start
            ))
            html_message = render_to_string('notification/meeting_reminder.html', {'meeting': meeting})

            for attending_user in attending_users:
                self.create_notification(title, meeting, attending_user, html_message)

            for contact in attending_contacts:
                if contact.email:
                    self.send_mail_to_contact(title, contact, html_message)

        scheduled_notifications.update(processed=True)

    def send_single_notification_to_user(self, user, notification):
        """
        Sends a single notification to the provided user
        :param user:
        :param notification:
        :return:
        """

        context = {
            'title': notification.title,
            'message': notification.message,
            'user': str(user),
            'workbench_url': settings.WORKBENCH_SETTINGS['url'],
            'workbench_title': site_preferences.site_name,
            'notification': notification
        }

        # render email text
        email_html_message = render_to_string('email/single_notification_email.html', context)
        email_plaintext_message = render_to_string('email/single_notification_email.txt', context)

        msg = EmailMultiAlternatives(
            # title:
            "{site_name}: {title}".format(
                site_name=site_preferences.site_name,
                title=notification.title,
            ),
            # message:
            email_plaintext_message,
            # from:
            site_preferences.email_from,
            # to:
            [user.email]
        )
        msg.attach_alternative(email_html_message, "text/html")
        msg.send()

    def send_multiple_notifications_to_user(self, user, notifications):
        context = {
            'user': str(user),
            'notifications': notifications,
            'workbench_url': settings.WORKBENCH_SETTINGS['url'],
            'workbench_title': site_preferences.site_name
        }

        # render email text
        email_html_message = render_to_string('email/multiple_notifications_email.html', context)
        email_plaintext_message = render_to_string('email/multiple_notifications_email.txt', context)

        msg = EmailMultiAlternatives(
            # title:
            _("{site_name}: Multiple notifications".format(
                site_name=site_preferences.site_name
            )),
            # message:
            email_plaintext_message,
            # from:
            site_preferences.email_from,
            # to:
            [user.email]
        )
        msg.attach_alternative(email_html_message, "text/html")
        msg.send()

    def handle(self, *args, **options):
        # process scheduled notifications first
        self.process_scheduled_notifications()

        # get all notifications that have recently been sent
        users_that_recently_received_notifications = Notification.objects.filter(
            processed=True,
            sent__gte=timezone.now() - timedelta(seconds=settings.NOTIFICATIONS_TIME_BETWEEN_EMAILS)
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

    def aggregate_and_send_notifications(self, notifications_qs, notification_count):
        notifications_by_user = {}
        users_by_pk = {}

        # aggregate notifications by user primary key
        for notification in notifications_qs:
            # create a list of notifications for the current user
            if notification.user.pk not in notifications_by_user:
                notifications_by_user[notification.user.pk] = []
                users_by_pk[notification.user.pk] = notification.user

            try:
                # check user notification configuration
                if notification.notification_type in notification.user.notification_configuration.allowed_notifications:
                    # append notification to notifications_by_user
                    notifications_by_user[notification.user.pk].append(notification)
            except:
                # no notification_configuration available for user, just append to notification anyway
                notifications_by_user[notification.user.pk].append(notification)

        # update all notifications, set them to processed=True
        notifications_qs.update(processed=True)

        if notification_count > 0:
            print("[{datetime}] Sending {num_notifications} notifications for {num_users} users".format(
                num_notifications=notification_count,
                datetime=timezone.now().isoformat(),
                num_users=len(notifications_by_user.keys()),
            ))

        for user_pk in notifications_by_user.keys():
            user = users_by_pk[user_pk]
            user_notifications = notifications_by_user[user_pk]
            notification_pk_list = []

            print("Aggregating {num_notifications} notifications for user {user}".format(
                num_notifications=len(user_notifications),
                user=str(user)
            ))

            if len(user_notifications) == 1:
                # only one notification, send this notification to the user
                self.send_single_notification_to_user(user, user_notifications[0])
                notification_pk_list.append(user_notifications[0].pk)
            elif len(user_notifications) > 1:
                # multiple notifications, compile a message with aggregated notifications
                for notification in user_notifications:
                    notification_pk_list.append(notification.pk)

                self.send_multiple_notifications_to_user(user, user_notifications)

            # update 'sent' attribute of the processed notifications
            Notification.objects.filter(pk__in=notification_pk_list).update(
                sent=timezone.now()
            )
