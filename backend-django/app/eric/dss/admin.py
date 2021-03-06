#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin
from django_admin_listfilter_dropdown.filters import RelatedDropdownFilter

from eric.dss.models.models import DSSEnvelope, DSSContainer, DSSFilesToImport
from eric.model_privileges.admin import ModelPrivilegeInline
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin, ProjectsFilter


@admin.register(DSSFilesToImport)
class DSSFilesToImportAdmin(admin.ModelAdmin):
    list_display = (
        'path',
        'imported',
        'last_import_attempt_failed',
        'last_import_fail_reason',
        'created_at',
    )
    search_fields = (
        'path',
        'last_import_fail_reason',
    )
    list_filter = (
        'imported',
        'imported_at',
        'last_import_attempt_failed',
        'last_import_attempt_failed_at',
    )


@admin.register(DSSEnvelope)
class DSSEnvelopeAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        'path',
        'created_by',
        'created_at',
    )
    search_fields = (
        'path',
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
        'name',
        'path',
        'created_by',
        'created_at',
    )
    search_fields = (
        'name',
        'path',
        'projects__name',
        "created_by__username",
        "created_by__email",
    )
    list_filter = (
        ProjectsFilter,
    )
    inlines = (ModelPrivilegeInline,)
    autocomplete_fields = ('projects',)
