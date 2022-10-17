#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from django.urls import reverse
from django.utils.html import format_html

from admin_auto_filters.filters import AutocompleteFilter
from rangefilter.filter import DateRangeFilter

from eric.db_logging.config import ADMIN_LIST_PER_PAGE
from eric.db_logging.models.models import DBLog


class UserFilter(AutocompleteFilter):
    title = "User"
    field_name = "user"


class HasUserFilter(SimpleListFilter):
    title = "Has User"
    parameter_name = "has_user"

    def lookups(self, request, model_admin):
        return [
            ("has_user", "Has User"),
            ("no_user", "No User"),
        ]

    def queryset(self, request, queryset):
        value = self.value()
        if value is None:
            return queryset
        else:
            filter_null_user = value == "no_user"
            return queryset.filter(user__isnull=filter_null_user)


@admin.register(DBLog)
class DBLogAdmin(admin.ModelAdmin):
    list_display = (
        "created_at_formatted",
        "level",
        "message",
        "user_identification",
        "hash",
    )
    list_display_links = (
        "created_at_formatted",
        "message",
    )
    list_filter = (
        "created_at",
        ("created_at", DateRangeFilter),
        "level",
        HasUserFilter,
        UserFilter,
    )
    search_fields = (
        "message",
        "trace",
        "hash",
    )
    readonly_fields = (
        "created_at_formatted",
        "logger_name",
        "level",
        "message",
        "hash",
        "occurrences",
        "user_identification",
        "traceback",
        "request_info_formatted",
    )
    fields = readonly_fields + ("processed",)
    list_per_page = ADMIN_LIST_PER_PAGE
    actions = [
        "make_processed",
        "make_unprocessed",
        "delete_occurrences",
    ]

    def traceback(self, instance):
        return format_html("<pre><code>{trace}</code></pre>", trace=instance.trace or "")

    def request_info_formatted(self, instance):
        return format_html("<pre><code>{request_info}</code></pre>", request_info=instance.request_info or "")

    request_info_formatted.short_description = "Request Info"

    def occurrences(self, instance):
        list_url = reverse("admin:db_logging_dblog_changelist") + f"?hash={instance.hash}"
        count = instance.occurrences.count()
        html = f'<a href="{list_url}">{count} occurrence(s)</a>'

        return format_html(html)

    def has_add_permission(self, request):
        return False

    def make_processed(self, request, queryset):
        queryset.update(processed=True)

    make_processed.short_description = "Mark selected logs as processed"

    def make_unprocessed(self, request, queryset):
        queryset.update(processed=False)

    make_unprocessed.short_description = "Mark selected logs as unprocessed"

    def delete_occurrences(self, request, queryset):
        first = queryset.first()
        first.occurrences.delete()

    delete_occurrences.short_description = "Delete all occurrences of first selected log"
