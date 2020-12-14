#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

import ldap
from django.conf import settings
from django.core.management.base import BaseCommand
from django_auth_ldap.backend import LDAPBackend
from django_auth_ldap.backend import _LDAPUser
from ldap.controls import SimplePagedResultsControl

PAGE_SIZE = 50
DEFAULT_FILTER = 'uid=*'


class Command(BaseCommand):
    help = 'Prints LDAP user data'

    def add_arguments(self, parser):
        parser.add_argument('-f', '--filter', type=str, help=f'LDAP Filter String. Default: {DEFAULT_FILTER}')

    def handle(self, *args, **options):
        filter_string = options.get('filter', DEFAULT_FILTER)

        ldap_backend = LDAPBackend()
        ldap_user = _LDAPUser(backend=ldap_backend, username='')
        ldap_connection = ldap_user.connection

        # Initialize the LDAP controls for paging.
        # Note that we pass '' for the cookie because on first iteration, it starts out empty.
        ldap_controls = SimplePagedResultsControl(True, size=PAGE_SIZE, cookie='')

        while True:
            # Send search request
            # If you leave out the ATTRLIST it'll return all attributes which you have permissions to access.
            # You may want to adjust the scope level as well
            # (perhaps "ldap.SCOPE_SUBTREE", but it can reduce performance if you don't need it).
            message_id = ldap_connection.search_ext(
                base=settings.AUTH_LDAP_USER_SEARCH.base_dn,
                scope=ldap.SCOPE_SUBTREE,
                filterstr=filter_string,
                serverctrls=[ldap_controls]
            )

            # Pull the results from the search request
            rtype, rdata, rmsgid, server_controls = ldap_connection.result3(message_id)
            rdata = settings.AUTH_LDAP_USER_SEARCH._process_results(rdata)

            # Each "rdata" is a tuple of the form (dn, attrs), where dn is a string containing the
            # DN (distinguished name) of the entry, and attrs is a dictionary containing the attributes associated
            # with the entry. The keys of attrs are strings, and the associated values are lists of strings.

            for distinguished_name, attributes in rdata:
                username = "".join(attributes['uid'])
                print(f"{username} \t| {distinguished_name}")
                print(attributes)

            # Look through the returned controls and find the page controls.
            # This will also have our returned cookie which we need to make the next search request.
            page_controls = [
                control for control in server_controls
                if control.controlType == SimplePagedResultsControl.controlType
            ]
            if not page_controls:
                print('Warning: Server ignores RFC 2696 control.')
                break

            # Ok, we did find the page control, yank the cookie from it and insert it into the control for our
            # next search. If however there is no cookie, we are done!

            cookie = page_controls[0].cookie
            ldap_controls.cookie = cookie
            if not cookie:
                break
