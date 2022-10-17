#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin
from django.contrib.admin import TabularInline
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.utils.translation import gettext_lazy as _

from admin_auto_filters.filters import AutocompleteFilter

from eric.drives.models.models import Directory, Drive
from eric.model_privileges.admin import ModelPrivilegeInline
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin, ProjectsFilter
from eric.shared_elements.models import File

User = get_user_model()


class DirectoryInline(TabularInline):
    model = Directory
    verbose_name = _("Directory")
    verbose_name_plural = _("Directories")
    extra = 1


class DriveFilter(AutocompleteFilter):
    title = "Drive"
    field_name = "drive"


@admin.action(description="Trash Files in selected Directories")
def bulk_trash_directories(modeladmin, request, queryset):
    backlink = request.get_full_path()

    if "apply" in request.POST:
        # get all relevant directories including subdirectories
        selected_directories = queryset.all()
        selected_directories_and_subdirectories = []
        for selected_directory in selected_directories:
            selected_directories_and_subdirectories += selected_directory.get_all_sub_directories()

        directories = Directory.objects.filter(pk__in=selected_directories_and_subdirectories)
        selected_directories_count = directories.count()

        # trash all files found in selected directories including subdirectories
        files = File.objects.filter(directory__in=directories)
        selected_files_count = files.count()
        files.update(deleted=True)

        modeladmin.message_user(
            request, f"Trashed {selected_files_count} Files in {selected_directories_count} selected Directories"
        )

        return HttpResponseRedirect(backlink)

    return render(request, "admin/bulk_trash_directories.html", context={"items": queryset, "backlink": backlink})


@admin.action(description="Delete selected Directories and its related Files")
def bulk_trash_and_delete_directories(modeladmin, request, queryset):
    backlink = request.get_full_path()

    if "apply" in request.POST:
        # get all relevant directories including subdirectories
        selected_directories = queryset.all()
        selected_directories_and_subdirectories = []
        for selected_directory in selected_directories:
            selected_directories_and_subdirectories += selected_directory.get_all_sub_directories()

        directories = Directory.objects.filter(pk__in=selected_directories_and_subdirectories)
        selected_directories_count = directories.count()

        # trash and delete all files found in selected directories including subdirectories
        files = File.objects.filter(directory__in=directories)
        selected_files_count = files.count()
        files.update(deleted=True)
        files.delete()

        # delete all directories including subdirectories but not root directories
        directories.exclude(directory=None).delete()

        modeladmin.message_user(
            request,
            f"Permanently deleted {selected_directories_count} selected Directories and {selected_files_count} Files",
        )

        return HttpResponseRedirect(backlink)

    return render(
        request, "admin/bulk_trash_and_delete_directories.html", context={"items": queryset, "backlink": backlink}
    )


@admin.register(Directory)
class DirectoryAdmin(admin.ModelAdmin):
    list_display = (
        "projects",
        "drive",
        "directory",
        "name",
        "created_by",
    )
    readonly_fields = ("projects",)
    list_display_links = ("name",)
    list_filter = (DriveFilter,)
    search_fields = ("name",)
    actions = (
        bulk_trash_directories,
        bulk_trash_and_delete_directories,
    )

    # Disable the default action for deleting selected Directories as we created our own method for it
    # which also trashes items first.
    def get_actions(self, request):
        actions = super().get_actions(request)
        del actions["delete_selected"]
        return actions

    def projects(self, obj):
        return ", ".join([str(project) for project in obj.drive.projects.all()])


@admin.register(Drive)
class DriveAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        "title",
        "created_by",
        "created_at",
    )
    list_filter = (ProjectsFilter,)
    search_fields = (
        "projects__name",
        "title",
        "created_by__username",
        "created_by__email",
    )
    inlines = (
        ModelPrivilegeInline,
        DirectoryInline,
    )
    autocomplete_fields = ("projects",)
