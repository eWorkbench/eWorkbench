#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin

from eric.sortable_menu.models import MenuEntry, MenuEntryParameter


class MenuEntryParameterInline(admin.TabularInline):
    model = MenuEntryParameter
    verbose_name = "Parameter"
    verbose_name_plural = "Parameters"
    extra = 1


@admin.register(MenuEntry)
class MenuEntryAdmin(admin.ModelAdmin):
    model = MenuEntry
    list_display = (
        "route",
        "owner",
        "ordering",
    )
    search_fields = (
        "owner__username",
        "owner__email",
        "route",
    )
    list_select_related = ("owner",)
    inlines = (MenuEntryParameterInline,)
    readonly_fields = ("owner",)
