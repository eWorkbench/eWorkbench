#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
from copy import deepcopy

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import BaseCommand

from eric.core.models import disable_permission_checks
from eric.sortable_menu.models import MenuEntry, MenuEntryParameter

User = get_user_model()

logger = logging.getLogger(__name__)


def build_query_string(route_name, params):
    query_string = route_name

    if params and len(params) > 0:
        query_string += "?"

        for param in params:
            query_string += param["name"] + "=" + param["value"] + "&"

    return query_string


class Command(BaseCommand):
    """
    Menu Entries can be updated by the developer by adding or removing a menu entry in
    WORKBENCH_SETTINGS.default_menu_entries
    """

    help = "Syncs the menu entries in WORKBENCH_SETTINGS.default_menu_entries with the users menu entries"

    def handle(self, *args, **options):
        # get all users
        users = User.objects.all().prefetch_related("menu_entries", "menu_entries__menu_entry_parameters")

        logger.info("Syncing menu entries of %(num_users)d users" % {"num_users": users.count()})

        print("Syncing", users.count(), "users")

        default_menu_entries = settings.WORKBENCH_SETTINGS["default_menu_entries"]

        default_routes = []
        menu_entry_by_query_string = {}

        with disable_permission_checks(MenuEntry):
            # collect an array of default routes
            for menu_entry in default_menu_entries:
                query_string = build_query_string(menu_entry["route"], menu_entry["menu_entry_parameters"])
                default_routes.append(query_string)
                menu_entry_by_query_string[query_string] = menu_entry

            # iterate over all users
            for user in users:
                if user.menu_entries.all().count() > 0:
                    # for the current user, check all menu entries
                    found_routes = []

                    for menu_entry in user.menu_entries.all():
                        query_string = build_query_string(
                            menu_entry.route, menu_entry.menu_entry_parameters.all().values()
                        )

                        if query_string not in default_routes:
                            print(
                                "found a route that should be deleted -> delete route with query string {}".format(
                                    query_string
                                )
                            )
                        else:
                            found_routes.append(query_string)

                    # match found_routes with default_routes - if default_routes has more routes, we need to add them
                    diff_routes = list(set(default_routes) - set(found_routes))

                    if len(diff_routes) > 0:
                        print(f"We need to add the following routes for user {user.username}")

                        for query_string in diff_routes:
                            print(query_string)

                            menu_entry_dict = deepcopy(menu_entry_by_query_string[query_string])

                            menu_entry_parameter_list = []

                            if "menu_entry_parameters" in menu_entry_dict:
                                menu_entry_parameter_list = menu_entry_dict.pop("menu_entry_parameters")

                            # create a new menu entry
                            menu_entry = MenuEntry(**menu_entry_dict)
                            menu_entry.owner = user
                            menu_entry.save()

                            # and create the menu entry parameters
                            for menu_entry_parameter_dict in menu_entry_parameter_list:
                                MenuEntryParameter.objects.create(menu_entry=menu_entry, **menu_entry_parameter_dict)
