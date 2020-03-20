#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#


class ReadOnlyOnUpdateAdminMixin:
    """ provides a mixin that adds fields that are readonly only when we are updating an existing object """

    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return self.readonly_fields + self.onupdate_readonly_fields
        return self.readonly_fields
