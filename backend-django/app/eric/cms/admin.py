#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin
from django.contrib.auth import get_user_model

from eric.cms.models import Content
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin

User = get_user_model()


@admin.register(Content)
class ContentAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    class Media:
        css = {
            'all': ('eric/admin/css/dmp_form_admin.css',),
        }
        js = {
            'js': ('ckeditor/ckeditor/ckeditor.js', 'eric/admin/js/dmp_form_admin.js',),
        }

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return list(self.readonly_fields) + ['slug', 'title']

        return self.readonly_fields

    def get_prepopulated_fields(self, request, obj=None):
        if not obj:
            return {"slug": ("title",)}

        return {}

    fields = (
        'title', 'text', 'slug',
    )
    list_display = (
        'title', 'slug',
        'created_by', 'created_at',
        'last_modified_by', 'last_modified_at',
    )
    search_fields = (
        'title',
        'text',
        'slug',
        "created_by__username",
        "created_by__email"
    )

    # allow copy of an object
    save_as = True
