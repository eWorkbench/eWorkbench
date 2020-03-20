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

from eric.notifications.models import Notification
from eric.site_preferences.models import options as site_preferences

User = get_user_model()


class Command(BaseCommand):
    help = 'send notifications'

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
            else:
                # multiple notifications, compile a message with aggregated notifications
                for notification in user_notifications:
                    notification_pk_list.append(notification.pk)

                self.send_multiple_notifications_to_user(user, user_notifications)

            # update 'sent' attribute of the processed notifications
            Notification.objects.filter(pk__in=notification_pk_list).update(
                sent=timezone.now()
            )
