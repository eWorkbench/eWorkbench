#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django import template


register = template.Library()


@register.inclusion_tag('widgets/display_user_widget.html')
def display_user_widget(user):
    """
    Displays a users first and last name
    :param user:
    :return:
    """
    context = {
        'user': user
    }

    return context


@register.inclusion_tag('widgets/display_user_group_widget.html')
def display_user_group_widget(user_group):
    """
    Displays a user groups name
    :param user_group:
    :return:
    """
    context = {
        'user_group': user_group
    }

    return context
