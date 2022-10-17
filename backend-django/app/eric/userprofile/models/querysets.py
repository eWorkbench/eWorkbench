#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from eric.core.models import BaseQuerySet


class UserProfileQuerySet(BaseQuerySet):
    """
    This exists for compatibility purposes only. The actual permission checks are performed in other places.
    Filtering by user here will lead to problems with the LDAP integration.
    """

    def viewable(self, *args, **kwargs):
        return self.all()

    def editable(self, *args, **kwargs):
        return self.all()

    def deletable(self, *args, **kwargs):
        return self.none()

    def prefetch_common(self, *args, **kwargs):
        return super().select_related(
            "user",
        )
