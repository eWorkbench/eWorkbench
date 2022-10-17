#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from eric.dss.models.models import DSSContainer, DSSEnvelope, DSSFilesToImport
from eric.model_privileges.admin import ModelPrivilegeInline
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin, ProjectsFilter


def requeue_hanging_imports(modeladmin, request, queryset):
    queryset.update(import_in_progress=False)


requeue_hanging_imports.short_description = _(
    "Requeue hanging imports by setting import_in_progress to false. " "Use with caution!"
)


@admin.register(DSSFilesToImport)
class DSSFilesToImportAdmin(admin.ModelAdmin):
    list_display = (
        "path",
        "imported",
        "last_import_attempt_failed",
        "last_import_fail_reason",
        "created_at",
        "import_in_progress",
    )
    search_fields = (
        "path",
        "last_import_fail_reason",
    )
    list_filter = (
        "imported",
        "imported_at",
        "last_import_attempt_failed",
        "last_import_attempt_failed_at",
        "created_at",
        "import_in_progress",
    )
    actions = [
        requeue_hanging_imports,
    ]


@admin.register(DSSEnvelope)
class DSSEnvelopeAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        "path",
        "created_by",
        "created_at",
    )
    search_fields = (
        "path",
        "created_by__username",
        "created_by__email",
    )


@admin.register(DSSContainer)
class DSSContainerAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    class Media:
        # Media class required because of bug in django-admin-autocomplete-filter
        # https://github.com/farhan0581/django-admin-autocomplete-filter/issues/10
        pass

    list_display = (
        "name",
        "path",
        "created_by",
        "created_at",
    )
    search_fields = (
        "name",
        "path",
        "projects__name",
        "created_by__username",
        "created_by__email",
    )
    list_filter = (ProjectsFilter,)
    inlines = (ModelPrivilegeInline,)
    autocomplete_fields = ("projects",)
