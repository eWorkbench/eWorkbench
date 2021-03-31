#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from eric.resources.models import StudyRoom, DisplayDesign


@admin.register(DisplayDesign)
class DisplayDesignAdmin(admin.ModelAdmin):
    list_display = (
        '__str__',
    )


@admin.register(StudyRoom)
class StudyRoomAdmin(admin.ModelAdmin):
    list_display = (
        'resource',
        'room_id',
        'branch_library',
        'display_design',
        'is_bookable_by_students',
    )
    list_filter = (
        'branch_library',
        'display_design__key',
        'is_bookable_by_students',
    )
    search_fields = (
        'id',
        'resource__name',
        'room_id',
    )
    readonly_fields = (
        'resource_link',
    )
    autocomplete_fields = (
        'resource',
    )

    @staticmethod
    def resource_link(instance):
        url = reverse('admin:projects_resource_change', kwargs={'object_id': instance.resource.pk})
        html = f'<a href="{url}">Resource Details</a>'

        return format_html(html)
