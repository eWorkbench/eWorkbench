#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.core.management import BaseCommand

from eric.notifications.models import NotificationConfiguration

User = get_user_model()


class Command(BaseCommand):
    help = 'add notification configuration for each active user (if not already exists)'

    def handle(self, *args, **options):

        users = User.objects.filter(
            is_active=True, last_login__isnull=False
        ).select_related('notification_configuration')

        print("Syncing {num_users} users".format(num_users=len(users)))

        for user in users:
            try:
                a = user.notification_configuration
            except:
                print("No notification configuration exists for {user}".format(user=user))

                NotificationConfiguration.objects.create(
                    user_id=user.pk,
                    allowed_notifications=[
                        NotificationConfiguration.NOTIFICATION_CONF_MEETING_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_MEETING_RELATION_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_MEETING_USER_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_TASK_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_TASK_RELATION_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_TASK_USER_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_PROJECT_CHANGED,
                        NotificationConfiguration.NOTIFICATION_CONF_PROJECT_USER_CHANGED
                    ]
                )

                print("User {user} allows receiving all possible notifications".format(user=user))
