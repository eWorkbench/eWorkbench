#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains basic admin functionality for eric workbench pictures """

from django.contrib import admin
from django.contrib.admin import TabularInline
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

from eric.drives.models.models import Drive, Directory
from eric.model_privileges.admin import ModelPrivilegeInline
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin, ProjectsFilter

User = get_user_model()


class DirectoryInline(TabularInline):
    model = Directory
    verbose_name = _("Directory")
    verbose_name_plural = _("Directories")
    extra = 1


@admin.register(Drive)
class DriveAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    class Media:
        # Media class required because of bug in django-admin-autocomplete-filter
        # https://github.com/farhan0581/django-admin-autocomplete-filter/issues/10
        pass

    list_display = ('title', 'created_by', 'created_at',)
    list_filter = (
        ProjectsFilter,
    )
    search_fields = (
        'projects__name',
        'title',
        "created_by__username",
        "created_by__email",
    )
    inlines = (ModelPrivilegeInline, DirectoryInline,)
    autocomplete_fields = ('projects',)
