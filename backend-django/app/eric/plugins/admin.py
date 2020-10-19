#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains basic admin functionality for eric workbench plugins """

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import models
from django.forms import TextInput

from eric.model_privileges.admin import ModelPrivilegeInline
from eric.plugins.models.models import Plugin, PluginInstance
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin, ProjectsFilter

User = get_user_model()


@admin.register(Plugin)
class PluginAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    class Media:
        js = (
            'ckeditor/ckeditor/ckeditor.js',
        )

    list_display = (
        'title',
        'short_description',
        'long_description',
        'path',
    )
    list_filter = ()
    search_fields = ('title', 'short_description',)
    formfield_overrides = {
        models.CharField: {'widget': TextInput(attrs={'size': '110'})}
    }
    autocomplete_fields = (
        'user_availability_selected_users',
        'user_availability_selected_user_groups',
        'responsible_users',
    )


@admin.register(PluginInstance)
class PluginInstanceAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    class Media:
        # Media class required because of bug in django-admin-autocomplete-filter
        # https://github.com/farhan0581/django-admin-autocomplete-filter/issues/10
        pass

    list_display = ('title', 'created_by', 'created_at',)
    list_filter = (
        ProjectsFilter,
    )
    search_fields = ('title', 'projects__name', 'rawdata',)
    inlines = (ModelPrivilegeInline,)
    autocomplete_fields = ('plugin', 'projects',)
