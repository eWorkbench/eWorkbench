#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from admin_auto_filters.filters import AutocompleteFilter
from django.contrib import admin
from django.utils.html import format_html

from eric.caldav.models import CaldavItem
from eric.shared_elements.models import Meeting


class DeletedViaCalDavByFilter(AutocompleteFilter):
    title = 'Deleted Via CalDAV by'
    field_name = 'deleted_via_caldav_by'


@admin.register(CaldavItem)
class CaldavItemAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'meeting_link',
        'created_at',
        'last_modified_at',
        'deleted_via_caldav_on',
        'deleted_via_caldav_by',
    )
    list_filter = (
        'created_at',
        'last_modified_at',
        'deleted_via_caldav_on',
        DeletedViaCalDavByFilter,
    )
    readonly_fields = (
        'meeting',
    )
    search_fields = (
        "id",
        'name',
        "text",
        "meeting__title",
        "meeting__created_by__username",
        "meeting__created_by__email",
        "meeting__attending_users__username",
        "meeting__attending_users__email",
        "deleted_via_caldav_by__email",
        "deleted_via_caldav_by__username",
    )

    @staticmethod
    def meeting_link(item):
        from django.shortcuts import resolve_url
        from django.contrib.admin.templatetags.admin_urls import admin_urlname
        if item.meeting:
            url = resolve_url(admin_urlname(Meeting._meta, 'change'), item.meeting.pk)
            return format_html('<a href="{url}">{name}</a>'.format(url=url, name=str(item.meeting)))
        else:
            return 'None'
