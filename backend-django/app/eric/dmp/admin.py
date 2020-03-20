#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from adminsortable2.admin import SortableInlineAdminMixin
from django.contrib import admin
from django_admin_listfilter_dropdown.filters import RelatedDropdownFilter

from eric.core.admin.readonly_on_update import ReadOnlyOnUpdateAdminMixin
from eric.dmp.models import Dmp, DmpForm, DmpFormData, DmpFormField


class DmpFormFieldInline(SortableInlineAdminMixin, admin.TabularInline):
    model = DmpFormField
    sortable_field_name = 'ordering'
    extra = 0


class DmpFormDataInline(admin.TabularInline):
    model = DmpFormData
    fields = ('name', 'type', 'value', 'infotext_display_html')
    readonly_fields = ('name', 'type', 'infotext_display_html',)
    extra = 0

    def has_delete_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False


@admin.register(Dmp)
class DmpAdmin(ReadOnlyOnUpdateAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'status', 'dmp_form', 'created_by', 'created_at',)
    list_filter = (
        ('projects', RelatedDropdownFilter),
        ('dmp_form', RelatedDropdownFilter),
        ('status', admin.AllValuesFieldListFilter),
    )
    readonly_fields = ()
    list_select_related = ('dmp_form',)
    search_fields = (
        'title',
        "created_by__username",
        "created_by__email",
    )
    onupdate_readonly_fields = ('dmp_form',)
    inlines = [
        DmpFormDataInline,
    ]


@admin.register(DmpForm)
class DmpFormAdmin(admin.ModelAdmin):
    class Media:
        css = {
            'all': ('eric/admin/css/dmp_form_admin.css',),
        }
        js = {
            'js': ('ckeditor/ckeditor/ckeditor.js', 'eric/admin/js/dmp_form_admin.js',),
        }

    list_display = (
        'title',
        'created_by',
        'created_at',
    )
    list_select_related = ('created_by',)
    search_fields = (
        'title',
        'description',
        'dmp_form_fields__name',
        'dmp_form_fields__infotext',
    )
    inlines = [
        DmpFormFieldInline,
    ]

    # allow copy of an object
    save_as = True
