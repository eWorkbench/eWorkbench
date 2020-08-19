#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains basic admin functionality for eric workbench pictures """

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django_admin_listfilter_dropdown.filters import RelatedDropdownFilter

from eric.kanban_boards.models import KanbanBoard, KanbanBoardColumn
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
        'kanban_board_columns__title',
        "created_by__username",
        "created_by__email",
    )
    inlines = (ModelPrivilegeInline, KanbanBoardColumnInline,)
    autocomplete_fields = ('projects', )
