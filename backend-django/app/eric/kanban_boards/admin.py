#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains basic admin functionality for eric workbench pictures """

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

from eric.favourites.admin import UserFilter
from eric.kanban_boards.forms import KanbanBoardUserFilterSettingForm
from eric.kanban_boards.models import KanbanBoard, KanbanBoardColumn
from eric.kanban_boards.models.models import KanbanBoardUserFilterSetting, KanbanBoardUserSetting
from eric.model_privileges.admin import ModelPrivilegeInline
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin, ProjectsFilter

User = get_user_model()


class KanbanBoardColumnInline(admin.TabularInline):
    """
    Inline Admin for Kanban Board columns
    """

    model = KanbanBoardColumn
    verbose_name = _("Kanban Board Column")
    verbose_name_plural = _("Kanban Board Columns")
    extra = 1


@admin.register(KanbanBoard)
class KanbanBoardAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        "title",
        "created_by",
        "created_at",
    )
    list_filter = (ProjectsFilter,)
    search_fields = (
        "projects__name",
        "title",
        "kanban_board_columns__title",
        "created_by__username",
        "created_by__email",
    )
    inlines = (
        ModelPrivilegeInline,
        KanbanBoardColumnInline,
    )
    autocomplete_fields = ("projects",)


@admin.register(KanbanBoardUserFilterSetting)
class KanbanBoardUserFilterSettingAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "kanban_board",
    )
    search_fields = (
        "kanban_board__title",
        "user__username",
        "user__email",
        "user__userprofile__first_name",
        "user__userprofile__last_name",
    )
    list_filter = (UserFilter,)
    autocomplete_fields = ("user",)
    list_per_page = 20
    form = KanbanBoardUserFilterSettingForm


@admin.register(KanbanBoardUserSetting)
class KanbanBoardUserSettingAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "kanban_board",
    )
    search_fields = (
        "kanban_board__title",
        "user__username",
        "user__email",
        "user__userprofile__first_name",
        "user__userprofile__last_name",
    )
    list_filter = (UserFilter,)
    autocomplete_fields = ("user",)
    list_per_page = 20
