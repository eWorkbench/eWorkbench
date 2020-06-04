#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains basic admin functionality for eric workbench elements """

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django_admin_listfilter_dropdown.filters import RelatedDropdownFilter

from eric.model_privileges.admin import ModelPrivilegeInline
from eric.projects.admin import CreatedAndModifiedByReadOnlyAdminMixin
from eric.shared_elements.models import Contact, Note, Meeting, Task, TaskAssignedUser, File, \
    UploadedFileEntry, UserAttendsMeeting, ContactAttendsMeeting, TaskCheckList

User = get_user_model()


class ContactInline(admin.StackedInline):
    model = Contact


@admin.register(Contact)
class ContactAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        'first_name',
        'last_name',
        'company',
        'email',
        'created_by',
        'created_at',
    )
    list_filter = (
        ('projects', RelatedDropdownFilter),
        ('company', admin.AllValuesFieldListFilter),
    )
    search_fields = (
        'projects__name',
        'first_name',
        'last_name',
        'email',
        'company',
        "created_by__username",
        "created_by__email",
    )
    filter_horizontal = ('projects',)
    inlines = (ModelPrivilegeInline,)


@admin.register(Note)
class NoteAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        'subject',
        'created_by',
        'created_at',
    )
    search_fields = (
        'projects__name',
        'subject',
        'content',
        "created_by__username",
        "created_by__email",
    )
    filter_horizontal = ('projects',)
    inlines = (ModelPrivilegeInline,)
    list_filter = (
        ('projects', RelatedDropdownFilter),
    )


class UploadedFileEntryAdmin(admin.TabularInline):
    model = UploadedFileEntry
    verbose_name = 'Uploaded File Entry'
    verbose_name_plural = 'Uploaded File Entries'
    can_delete = False
    fields = (
        'mime_type',
        'original_filename',
        'file_size',
        'created_at',
        'created_by',
        'download_url',
    )
    readonly_fields = (
        'mime_type',
        'original_filename',
        'file_size',
        'created_at',
        'created_by',
        'download_url',
    )
    extra = 0

    def download_url(self, obj):
        from django.utils.html import format_html
        return format_html("<a href=\"%(url)s\">Download</a>" % {'url': obj.download_url})


@admin.register(File)
class FileAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        'title',
        'name',
        'created_by',
        'created_at',
    )
    readonly_fields = (
        'original_filename',
    )
    search_fields = (
        'title',
        'name',
        'original_filename',
        'description',
        'projects__name',
        "created_by__username",
        "created_by__email",
    )
    filter_horizontal = ('projects',)
    list_filter = (
        ('projects', RelatedDropdownFilter),
    )
    inlines = (UploadedFileEntryAdmin, ModelPrivilegeInline,)


class TaskAssignedUserInline(admin.StackedInline):
    """
    Inline Admin for users that are assigned to a Task
    """
    model = TaskAssignedUser
    verbose_name = _("Assigned User")
    verbose_name_plural = _("Assigned Users")
    extra = 1
    raw_id_fields = ('assigned_user',)


class TaskCheckListInline(admin.StackedInline):
    """
    Inline Admin for task checlist items
    """
    model = TaskCheckList
    verbose_name = _("Task Checklist Item")
    verbose_name_plural = _("Task Checklist Items")
    extra = 1


@admin.register(Task)
class TaskAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        'task_id',
        'title',
        'start_date',
        'due_date',
        'priority',
        'state',
        'created_by',
        'created_at',
    )
    list_filter = (
        ('projects', RelatedDropdownFilter),
        ('priority', admin.ChoicesFieldListFilter),
        ('state', admin.ChoicesFieldListFilter),
    )
    search_fields = (
        'projects__name',
        'title',
        'task_id',
        'description',
        "created_by__username",
        "created_by__email",
    )
    filter_horizontal = ('projects',)
    inlines = (TaskCheckListInline, TaskAssignedUserInline, ModelPrivilegeInline,)


class UserAttendsMeetingInline(admin.StackedInline):
    """
    Inline Admin for Users that attend a Meeting
    """
    model = UserAttendsMeeting
    verbose_name = 'Attending User'
    verbose_name_plural = 'Attending Users'
    extra = 1
    raw_id_fields = ('user',)


class ContactAttendsMeetingInline(admin.StackedInline):
    """
    Inline Admin for Contacts that attend a Meeting
    """
    model = ContactAttendsMeeting
    verbose_name = 'Attending Contact'
    verbose_name_plural = 'Attending Contacts'
    extra = 1
    raw_id_fields = ('contact',)


@admin.register(Meeting)
class MeetingAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        'title',
        'date_time_start',
        'date_time_end',
        'location',
        'created_by',
        'created_at',
    )
    list_filter = (
        ('projects', RelatedDropdownFilter),
    )
    search_fields = (
        'projects__name',
        'title',
        'text',
        'location',
        "created_by__username",
        "created_by__email",
    )
    filter_horizontal = (
        'projects',
    )
    inlines = (
        UserAttendsMeetingInline,
        ContactAttendsMeetingInline,
        ModelPrivilegeInline,
    )
