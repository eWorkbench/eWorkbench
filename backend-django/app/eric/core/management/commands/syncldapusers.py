#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import time

import ldap
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from django_auth_ldap.backend import LDAPBackend
from django_auth_ldap.backend import _LDAPUser
from ldap.controls import SimplePagedResultsControl

from eric.core.decorators import disable_django_caching
from eric.core.models import disable_permission_checks
from eric.notifications.models import NotificationConfiguration
from eric.projects.models import UserStorageLimit
from eric.userprofile.models import UserProfile

User = get_user_model()

PAGE_SIZE = 50


def create_controls(pagesize):
    """Create an LDAP control with a page size of "pagesize"."""
    # Initialize the LDAP controls for paging. Note that we pass ''
    # for the cookie because on first iteration, it starts out empty.
    return SimplePagedResultsControl(True, size=pagesize, cookie='')


def get_pctrls(serverctrls):
    """Lookup an LDAP paged control object from the returned controls."""
    # Look through the returned controls and find the page controls.
    # This will also have our returned cookie which we need to make
    # the next search request.
    return [c for c in serverctrls
            if c.controlType == SimplePagedResultsControl.controlType]


def set_cookie(lc_object, pctrls, pagesize):
    """Push latest cookie back into the page control."""
    cookie = pctrls[0].cookie
    lc_object.cookie = cookie
    return cookie


class Command(BaseCommand):
    help = 'Sync ldap users'

    # This is essentially a placeholder callback function. You would do your real
    # work inside of this. Really this should be all abstracted into a generator...
    def process_entry(self, dn, attrs):
        """Process an entry. The two arguments passed are the DN and
           a dictionary of attributes."""
        # print(dn, attrs)

        username = "".join(attrs['uid'])  # ToDo: change back to cn

        try:
            # fake an ldap user and set the internal user attributes, as if they were from LDAP
            ldap_user = _LDAPUser(self.ldap_backend, username=username)
            ldap_user._user_attrs = attrs

            # call populate user with the internal attributes
            # user = user.populate_user()

            # username = self.ldap_backend.ldap_to_django_username(username)

            (user, built) = self.ldap_backend.get_or_build_user(username, ldap_user)

            setattr(user, "ldap_user", ldap_user)

            user.save()

            # if not built:
            #     create_user_profile_ldap(user, ldap_user)
            #     assign_ldap_user_group(user, ldap_user)

            # user._get_or_create_user()

            # user = LDAPBackend().populate_user(username)

            if not user:
                print('ERROR: LDAPBackend().populate_user() did not find user with username=', username)
                print(repr(dn))
                print(attrs)
        except:
            print("Error trying to sync user with username=", username)
            print(repr(dn))
            print(attrs)
            raise

    def handle(self, *args, **options):

        from django_auth_ldap import backend

        with disable_django_caching(backend):
            with disable_permission_checks(User):
                with disable_permission_checks(UserProfile):
                    with disable_permission_checks(Group):
                        with disable_permission_checks(UserStorageLimit):
                            with disable_permission_checks(NotificationConfiguration):
                                users_processed = 0
                                start_time = time.time()

                                self.ldap_backend = LDAPBackend()

                                user = _LDAPUser(backend=self.ldap_backend, username='')

                                ldap_connection = user.connection

                                # settings.AUTH_LDAP_USER_SEARCH.base_dn
                                # settings.AUTH_LDAP_USER_SEARCH.filterstr

                                lc = create_controls(PAGE_SIZE)

                                while True:
                                    # Send search request
                                    try:
                                        # If you leave out the ATTRLIST it'll return all attributes
                                        # which you have permissions to access. You may want to adjust
                                        # the scope level as well (perhaps "ldap.SCOPE_SUBTREE", but
                                        # it can reduce performance if you don't need it).
                                        msgid = ldap_connection.search_ext(
                                            settings.AUTH_LDAP_USER_SEARCH.base_dn,
                                            ldap.SCOPE_SUBTREE, 'uid=*',
                                            serverctrls=[lc]
                                        )
                                    except ldap.LDAPError as e:
                                        print('LDAP search failed: %s' % e)
                                        exit()

                                    # Pull the results from the search request
                                    try:
                                        rtype, rdata, rmsgid, serverctrls = ldap_connection.result3(msgid)
                                    except ldap.LDAPError as e:
                                        print('Could not pull LDAP results: %s' % e)
                                        exit()

                                    rdata = settings.AUTH_LDAP_USER_SEARCH._process_results(rdata)

                                    # Each "rdata" is a tuple of the form (dn, attrs), where dn is
                                    # a string containing the DN (distinguished name) of the entry,
                                    # and attrs is a dictionary containing the attributes associated
                                    # with the entry. The keys of attrs are strings, and the associated
                                    # values are lists of strings.

                                    raw_processing_time_start = time.time()

                                    for dn, attrs in rdata:
                                        self.process_entry(dn, attrs)
                                        users_processed += 1

                                    raw_processing_time_end = time.time()

                                    # Get cookie for next request
                                    pctrls = get_pctrls(serverctrls)
                                    if not pctrls:
                                        print('Warning: Server ignores RFC 2696 control.')
                                        break

                                    # Ok, we did find the page control, yank the cookie from it and
                                    # insert it into the control for our next search. If however there
                                    # is no cookie, we are done!
                                    cookie = set_cookie(lc, pctrls, PAGE_SIZE)
                                    if not cookie:
                                        break

                                    # write a message with some statistics
                                    print(
                                        "Processed {} users in {} seconds (avg {} users per second, raw processing "
                                        "time {} seconds)".format(
                                            users_processed,
                                            time.time() - start_time,
                                            users_processed / (time.time() - start_time),
                                            raw_processing_time_end - raw_processing_time_start
                                        )
                                    )
