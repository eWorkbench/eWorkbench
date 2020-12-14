#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#


from django.contrib import admin
from django.contrib.auth import get_user_model

from eric.model_privileges.admin import ModelPrivilegeInline
from eric.pictures.models import Picture
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin, ProjectsFilter

User = get_user_model()


@admin.register(Picture)
class PictureAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    """ contains basic admin functionality for eric workbench pictures """

    list_display = (
        'title',
        'created_by',
        'created_at',
    )
    list_filter = (
        ProjectsFilter,
    )
    search_fields = (
        'projects__name',
        'title',
        "created_by__username",
        "created_by__email",
    )
    inlines = (ModelPrivilegeInline,)
    autocomplete_fields = ('projects',)
    raw_id_fields = ('uploaded_picture_entry',)
