#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf import settings
from django.core.mail import send_mail as django_send_mail
from django.template.loader import render_to_string

from eric.site_preferences.models import options as site_preferences


def send_mail(subject, message, to_email, html_message=None):
    return django_send_mail(
        subject=f'{site_preferences.site_name}: {subject}',
        message=message,
        from_email=site_preferences.email_from,
        recipient_list=[to_email],
        html_message=html_message,
    )


def send_notification_mail(user, title, message, notification=None):
    context = {
        'title': title,
        'message': message,
        'user': str(user),
        'workbench_url': settings.WORKBENCH_SETTINGS['url'],
        'workbench_title': site_preferences.site_name,
        'notification': notification
    }
    html = render_to_string('email/single_notification_email.html', context)
    plaintext = render_to_string('email/single_notification_email.txt', context)
    send_mail(subject=title, message=plaintext, html_message=html, to_email=user.email)


def is_user_notification_allowed(user, notification_type):
    from eric.notifications.models import NotificationConfiguration

    try:
        return notification_type in user.notification_configuration.allowed_notifications
    except NotificationConfiguration.DoesNotExist:
        return True
