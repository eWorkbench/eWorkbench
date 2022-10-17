#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin

from eric.cms.models import AcceptedScreen, Content, LaunchScreen
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin


@admin.register(Content)
class ContentAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    class Media:
        css = {
            "all": ("eric/admin/css/dmp_form_admin.css",),
        }
        js = (
            "ckeditor/ckeditor/ckeditor.js",
            "eric/admin/js/dmp_form_admin.js",
        )

    def get_readonly_fields(self, request, obj=None):
        # Make fields readonly for existing entries only
        if obj:
            return list(self.readonly_fields) + [
                "slug",
            ]

        return self.readonly_fields

    def get_prepopulated_fields(self, request, obj=None):
        # Prepopulation works for new objects only
        if not obj:
            return {"slug": ("title",)}

        return {}

    fields = (
        "title",
        "text",
        "slug",
        "public",
    )
    list_display = (
        "title",
        "slug",
        "created_by",
        "created_at",
        "last_modified_by",
        "last_modified_at",
        "public",
    )
    search_fields = (
        "title",
        "text",
        "slug",
        "created_by__username",
        "created_by__email",
    )

    # allow copy of an object
    save_as = True


@admin.register(LaunchScreen)
class LaunchAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    fields = (
        "ordering",
        "title",
        "text",
        "show_screen",
        "version",
    )
    list_display = (
        "ordering",
        "title",
        "show_screen",
        "version",
        "version_number",
        "last_modified_at",
    )
    search_fields = (
        "title",
        "text",
        "created_by__username",
        "created_by__email",
    )
    save_as = True


@admin.register(AcceptedScreen)
class AcceptedScreenAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    fields = (
        "created_by",
        "launch_screen",
    )
    readonly_fields = (
        "created_by",
        "launch_screen",
    )
    search_fields = (
        "created_by__username",
        "created_by__email",
        "launch_screen__title",
    )
