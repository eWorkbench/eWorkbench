#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

# Original License Information:
# Copyright (C) 2014 Okami, okami@fuzetsu.info

# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 3
# of the License, or (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.

import logging
from contextlib import contextmanager
from datetime import datetime

from django.conf import settings
from radicale import ical
from rest_framework.exceptions import PermissionDenied

from eric.caldav.meeting_synchronizer import MeetingSynchronizer
from eric.caldav.models import CaldavItem

logger = logging.getLogger('djradicale')


class Collection(ical.Collection):
    """
    Provides the collection class for Workbench Meetings
    """

    def save(self, text):
        """
        Docs:
          Save the text into the collection.
        """
        pass

    @property
    def headers(self):
        return (
            # ToDo: Probably change this information to workbench related version
            ical.Header('PRODID:-//Radicale//NONSGML Radicale Server//EN'),
            ical.Header('VERSION:%s' % self.version)
        )

    def delete(self):
        """
        This deletes a collection and all items from the collection.
        In our use case, we do not allow deleting a collection.
        """
        raise PermissionDenied

    def append(self, name, text):
        """
        Create a new Meeting (or update an existing meeting) in our database.
        Meetings are identified by their UID and (file)name.

        Docs:
          Append items from ``text`` to collection.
          If ``name`` is given, give this name to new items in ``text``.
        """
        self._append_or_replace(name, text)

    def replace(self, name, text):
        self._append_or_replace(name, text)

    def _append_or_replace(self, name, text):
        items = self._parse(text, settings.DJRADICALE_ICAL_TYPES, name).values()
        MeetingSynchronizer().create_or_update(name, items)

    def remove(self, name):
        """
        Remove an item by marking it as deleted.

        Docs:
          Remove object named ``name`` from collection.
        """
        item = CaldavItem.objects.filter(name=name).first()
        meeting = item.meeting

        if meeting and meeting.is_trashable():
            meeting.trash()

        if not meeting or meeting.is_trashable():
            item.set_deleted()
            item.save()

    @property
    def text(self):
        """
        Docs:
          Collection as plain text.
        """
        return ical.serialize(self.tag, self.headers, self.items.values())

    @classmethod
    def children(cls, path):
        """
        Docs:
          Yield the children of the collection at local ``path``.
        """

        # children = list(
        #     DBCollection.objects
        #         .filter(parent_path=path or '')
        #         .values_list('path', flat=True))
        children = ["default", ]
        return map(cls, children)

    @classmethod
    def is_node(cls, path):
        """
        Docs:
          Return ``True`` if relative ``path`` is a node.
          A node is a WebDAV collection whose members are other collections.
        """

        return True
        #
        # result = True
        # if path:
        #     result = (
        #         DBCollection.objects
        #             .filter(parent_path=path or '').exists())
        # return result

    @classmethod
    def is_leaf(cls, path):
        """
        Docs:
          Return ``True`` if relative ``path`` is a leaf.
          A leaf is a WebDAV collection whose members are not collections.
        """

        return True
        # result = False
        # if path:
        #     result = (
        #         CaldavItem.objects
        #             .filter(collection__path=path or '').exists())
        # return result

    @property
    def last_modified(self):
        """
        Docs:
          Get the last time the collection has been modified.
          The date is formatted according to rfc1123-5.2.14.
        """

        try:
            return datetime.strftime(
                CaldavItem.objects.viewable().sort('-last_modified_at').last_modified_at,
                '%a, %d %b %Y %H:%M:%S %z'
            )
        except Exception:
            return None

    @property
    def tag(self):
        """
        Docs:
          Type of the collection.
        """
        with self.props as props:
            if 'tag' not in props:
                if self.path.endswith(('.vcf', '/carddav')):
                    props['tag'] = 'VADDRESSBOOK'
                else:
                    props['tag'] = 'VCALENDAR'
            return props['tag']

    @property
    @contextmanager
    def props(self):
        """
        Get properties for a collection
        """
        yield {}

    @property
    def items(self):
        """
        Return all items within a collection (self.path)
        """
        # Note: There are no CaldavItems for deleted meetings (delete cascade)
        items_with_trashed_meetings = CaldavItem.objects.filter(meeting__deleted=True)
        caldav_items = CaldavItem.objects.viewable().difference(items_with_trashed_meetings)

        items = {}
        for item in caldav_items:
            # parse item.text such that only the listed ical types of DJRADICALE_ICAL_TYPES are extracted,
            # and add them into the items dictionary
            items.update(
                self._parse(item.text, settings.DJRADICALE_ICAL_TYPES, item.name)
            )

        return items
