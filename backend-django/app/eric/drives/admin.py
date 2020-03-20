#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains basic admin functionality for eric workbench pictures """

from django.contrib import admin
from django.contrib.admin import TabularInline
from django.contrib.auth import get_user_model
from django.utils.translation import ugettext_lazy as _
from django_admin_listfilter_dropdown.filters import RelatedDropdownFilter

from eric.drives.models.models import Drive, Directory
from eric.model_privileges.admin import ModelPrivilegeInline
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin

User = get_user_model()


class DirectoryInline(TabularInline):
    model = Directory
    verbose_name = _("Directory")
    verbose_name_plural = _("Directories")
    # raw_id_fields = ('child_object_id', )
    extra = 1


@admin.register(Drive)
class DriveAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'created_by', 'created_at',)
    list_filter = (
        ('projects', RelatedDropdownFilter),
    )
    search_fields = (
        'projects__name',
        'title',
        "created_by__username",
        "created_by__email",
    )
    filter_horizontal = ('projects',)
    inlines = (ModelPrivilegeInline, DirectoryInline,)
