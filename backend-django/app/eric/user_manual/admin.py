#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin
from django.contrib.auth import get_user_model

from adminsortable2.admin import SortableInlineAdminMixin

from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin
from eric.user_manual.models import UserManualCategory, UserManualHelpText, UserManualPlaceholder

User = get_user_model()


class UserManualHelpTextInline(SortableInlineAdminMixin, admin.TabularInline):
    model = UserManualHelpText
    sortable_field_name = "ordering"
    extra = 0


@admin.register(UserManualCategory)
class UserManualCategoryAdmin(admin.ModelAdmin):
    class Media:
        css = {
            "all": ("eric/admin/css/dmp_form_admin.css",),
        }
        js = (
            "ckeditor/ckeditor/ckeditor.js",
            "eric/admin/js/dmp_form_admin.js",
        )

    list_display = (
        "title",
        "ordering",
        "created_by",
        "created_at",
        "last_modified_by",
        "last_modified_at",
    )
    search_fields = (
        "title",
        "description",
        "created_by__username",
        "created_by__email",
    )
    inlines = (UserManualHelpTextInline,)
    # allow copy of an object
    save_as = True


@admin.register(UserManualPlaceholder)
class UserManualPlaceholderAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        "key",
        "__str__",
        "created_by",
        "created_at",
        "last_modified_by",
        "last_modified_at",
    )
    search_fields = (
        "key",
        "content",
        "created_by__username",
        "created_by__email",
    )
