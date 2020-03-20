#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django import template

register = template.Library()


@register.filter(expects_localtime=True)
def date_short(date):
    """
    Default Date Filter for Django Templates
    :param date:
    :return:
    """
    return date.strftime("%Y-%m-%d %H:%M") if date else None
