#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django import template
from django.conf import settings
from html2text import html2text

register = template.Library()


@register.filter()
def to_notification_url(notification):
    """
    Filter for converting a notification into a notification url
    """

    return settings.WORKBENCH_SETTINGS['notification_url'].format(
        workbench_url=settings.WORKBENCH_SETTINGS['url'],
        notification_pk=str(notification.pk)
    )


@register.filter()
def to_text(html):
    return html2text(html)
