#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from html import unescape

from django import template

register = template.Library()


@register.filter(expects_localtime=True)
def html_unescape(str):
    """
    Filter for unescaping html entities such as &auml;
    :param date:
    :return:
    """
    return unescape(str)
