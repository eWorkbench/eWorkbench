#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.conf import settings
from django.dispatch import receiver
from django_rest_multitokenauth.signals import post_auth
from django_userforeignkey.request import get_current_request

from eric.sortable_menu.models import MenuEntry, MenuEntryParameter

logger = logging.getLogger('eric.projects.models.handlers')


@receiver(post_auth)
def create_menu_entries_on_auth(sender, user, *args, **kwargs):
    """
    Creates menu_entries for the current user on first auth (if no menu entries exists)
    :param sender:
    :param user:
    :param args:
    :param kwargs:
    :return:
    """
    # set current requests user
    request = get_current_request()
    if request and (not hasattr(request, 'user') or request.user.is_anonymous):
        request.user = user

    # check if menu entries exist for the current user
    if not MenuEntry.objects.viewable().exists():
        if 'default_menu_entries' not in settings.WORKBENCH_SETTINGS:
            logger.debug("No default menu entries found in WORKBENCH_SETTINGS")
        else:
            logger.debug("Bulk creating menu entries")
            menu_entries = []
            menu_entry_parameters = []

            # copy settings
            from copy import deepcopy

            for menu_entry_dict in deepcopy(settings.WORKBENCH_SETTINGS['default_menu_entries']):

                menu_entry_paramter_list = []

                if 'menu_entry_parameters' in menu_entry_dict:
                    menu_entry_paramter_list = menu_entry_dict.pop('menu_entry_parameters')

                # create menu entry
                menu_entry = MenuEntry(**menu_entry_dict)
                menu_entries.append(menu_entry)

                for menu_entry_parameter_dict in menu_entry_paramter_list:
                    menu_entry_parameters.append(
                        MenuEntryParameter(menu_entry=menu_entry, **menu_entry_parameter_dict)
                    )

            MenuEntry.objects.bulk_create(menu_entries)
            MenuEntryParameter.objects.bulk_create(menu_entry_parameters)
