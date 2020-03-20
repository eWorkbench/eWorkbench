#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django import template


register = template.Library()


@register.inclusion_tag('widgets/simple_object_display.html')
def simple_object_display(object):
    """
    Simple display for any object
    :param object:
    :return:
    """
    context = {
        'object': object,
        'object_type': object.__class__.__name__
    }

    return context
