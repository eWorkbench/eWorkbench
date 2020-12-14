#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin


class IsDeleteableMixin:
    """ A simple mixin that forces is_deleteable to be implemented """

    def is_deleteable(self):
        raise NotImplementedError()


class DeleteableModelAdmin(admin.ModelAdmin):
    """
    A custom admin panel that checks whether or not an object can be deleted
    Note: mass delete (select for delete) is disabled on purpose
    """

    def get_actions(self, request):
        # Disable delete
        actions = super(DeleteableModelAdmin, self).get_actions(request)
        del actions['delete_selected']
        return actions

    def has_delete_permission(self, request, obj=None):
        if obj and not obj.is_deleteable():
            message = "This object can not be deleted"
            self.message_user(request, message)
            return False

        return super(DeleteableModelAdmin, self).has_delete_permission(request, obj)
