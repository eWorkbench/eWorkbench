#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from admin_auto_filters.filters import AutocompleteFilter
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django_admin_listfilter_dropdown.filters import DropdownFilter, ChoiceDropdownFilter
from django_changeset.models import ChangeSet, ChangeRecord

from eric.core.admin.filters import is_null_filter
from eric.core.admin.is_deleteable import DeleteableModelAdmin
from eric.model_privileges.admin import ModelPrivilegeInline
from eric.projects.models import Project, Resource, Role, ProjectRoleUserAssignment, \
    UserStorageLimit, ResourceBookingRuleMinimumDuration, ResourceBookingRuleMaximumDuration, \
    ResourceBookingRuleBookableHours, ResourceBookingRuleMinimumTimeBefore, ResourceBookingRuleMaximumTimeBefore, \
    ResourceBookingRuleTimeBetween, ResourceBookingRuleBookingsPerUser

User = get_user_model()


class ProjectFilter(AutocompleteFilter):
    """ Autocomplete filter for a single project """

    title = 'Project'
    field_name = 'project'
    field = 'project'


class ProjectsFilter(AutocompleteFilter):
    """ Autocomplete filter for a list of projects """

    title = 'Projects'
    field_name = 'projects'


class CreatedAndModifiedByReadOnlyAdminMixin:
    """
    An admin mixin that sets the following fields as readonly fields:
    - created_by
    - last_modified_by
    - created_at
    - last_modified_at
    """

    def get_readonly_fields(self, request, obj=None):
        return self.readonly_fields + (
            'created_by',
            'last_modified_by',
            'created_at',
            'last_modified_at',
        )

    def get_list_select_related(self, request, obj=None):
        return tuple((
            'created_by',
            'last_modified_by',
        ))


@admin.register(ProjectRoleUserAssignment)
class ProjectRoleUserAssignmentAdmin(DeleteableModelAdmin):
    model = ProjectRoleUserAssignment
    list_display = (
        'user',
        'role',
        'project',
        'created_by',
        'last_modified_by',
    )
    list_filter = (
        ProjectFilter,
        ('role', admin.RelatedFieldListFilter),
    )
    raw_id_fields = ('user',)
    autocomplete_fields = ('project',)
    search_fields = (
        'user__username',
        'user__email',
        'user__userprofile__last_name',
        'project__name',
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """ RoleAdmin is very similar to Django auth GroupAdmin """
    model = Role
    list_display = ('name',)
    filter_horizontal = ('permissions',)
    search_fields = ('name',)

    def formfield_for_manytomany(self, db_field, request=None, **kwargs):
        """
        In combination with filter_horizontal, this method makes sure that the permissions attribute is shown as a
        select list in the admin panel. This uses the same logic as the GroupAdmin for Django, with the addition of
        setting db_field.remote_field.through._meta.auto_created = True
        as our through table is not auto created.

        :param db_field:
        :param request:
        :param kwargs:
        :return:
        """
        if db_field.name == 'permissions':
            qs = kwargs.get('queryset', db_field.remote_field.model.objects)
            # Avoid a major performance hit resolving permission names which
            # triggers a content_type load:
            kwargs['queryset'] = qs.select_related('content_type')
            # set meta.auto_created to true for our through table
            db_field.remote_field.through._meta.auto_created = True

        return super(RoleAdmin, self).formfield_for_manytomany(
            db_field, request=request, **kwargs)


class ChangeSetInline(admin.StackedInline):
    model = ChangeSet


class ProjectInline(admin.TabularInline):
    model = Project
    extra = 0


class ProjectAssignedUsersInline(admin.TabularInline):
    verbose_name = 'Assigned User'
    verbose_name_plural = 'Assigned Users'
    model = ProjectRoleUserAssignment
    raw_id_fields = ('user',)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = (ProjectInline, ProjectAssignedUsersInline,)
    list_display = (
        'name',
        'project_state',
        'created_by',
        'created_at',
        'last_modified_by',
        'last_modified_at',
    )
    list_select_related = (
        'created_by',
        'last_modified_by',
    )
    list_filter = (
        'project_state',
    )
    search_fields = (
        'name',
        "created_by__username",
        "created_by__email",
    )
    autocomplete_fields = ('parent_project',)


class ChangeRecordInline(admin.StackedInline):
    model = ChangeRecord
    can_delete = False
    verbose_name = 'Change Record'
    verbose_name_plural = 'Change Records'
    extra = 0


@admin.register(ChangeSet)
class ChangesetAdmin(admin.ModelAdmin):
    list_display = (
        '__str__',
        'user',
        'date',
        'object_type',
        'object_uuid',
    )
    list_filter = (
        'object_type',
    )
    search_fields = (
        'object_uuid',
        'user__username',
        'user__email',
        'user__userprofile__last_name',
    )
    inlines = (
        ChangeRecordInline,
    )


@admin.register(ChangeRecord)
class ChangeRecordAdmin(admin.ModelAdmin):
    list_display = (
        '__str__',
        'field_name',
        'old_value',
        'new_value',
        'change_set',
    )


def make_general_usage_setting_global(modeladmin, request, queryset):
    queryset.update(general_usage_setting=Resource.GLOBAL)


def make_general_usage_setting_groups(modeladmin, request, queryset):
    queryset.update(general_usage_setting=Resource.SELECTED_GROUPS)


def make_type_room(modeladmin, request, queryset):
    queryset.update(type=Resource.ROOM)


def make_type_labeq(modeladmin, request, queryset):
    queryset.update(type=Resource.LAB_EQUIPMENT)


def make_type_offeq(modeladmin, request, queryset):
    queryset.update(type=Resource.OFFICE_EQUIPMENT)


def make_type_itres(modeladmin, request, queryset):
    queryset.update(type=Resource.IT_RESOURCE)


make_general_usage_setting_global.short_description = _("Make selected resources available global")
make_general_usage_setting_groups.short_description = _("Make selected resources available for selected groups")
make_type_room.short_description = _("Make selected resources type ROOM")
make_type_labeq.short_description = _("Make selected resources type LAB_EQUIPMENT")
make_type_offeq.short_description = _("Make selected resources type OFFICE_EQUIPMENT")
make_type_itres.short_description = _("Make selected resources type IT_RESOURCE")


class ResourceBookingRuleMinimumDurationInline(admin.TabularInline):
    model = ResourceBookingRuleMinimumDuration
    verbose_name = _('Resource Booking Rule Minimum Duration')
    verbose_name_plural = _('Resource Booking Rules Minimum Duration')


class ResourceBookingRuleMaximumDurationInline(admin.TabularInline):
    model = ResourceBookingRuleMaximumDuration
    verbose_name = _('Resource Booking Rule Maximum Duration')
    verbose_name_plural = _('Resource Booking Rules Maximum Duration')


class ResourceBookingRuleBookableHoursInline(admin.TabularInline):
    model = ResourceBookingRuleBookableHours
    verbose_name = _('Resource Booking Rule Bookable Hours')
    verbose_name_plural = _('Resource Booking Rules Bookable Hours')
    extra = 1


class ResourceBookingRuleMinimumTimeBeforeInline(admin.TabularInline):
    model = ResourceBookingRuleMinimumTimeBefore
    verbose_name = _('Resource Booking Rule Minimum Time Before')
    verbose_name_plural = _('Resource Booking Rules Minimum Time Before')


class ResourceBookingRuleMaximumTimeBeforeInline(admin.TabularInline):
    model = ResourceBookingRuleMaximumTimeBefore
    verbose_name = _('Resource Booking Rule Maximum Time Before')
    verbose_name_plural = _('Resource Booking Rules Maximum Time Before')


class ResourceBookingRuleTimeBetweenInline(admin.TabularInline):
    model = ResourceBookingRuleTimeBetween
    verbose_name = _('Resource Booking Rule Time Between')
    verbose_name_plural = _('Resource Booking Rules Time Between')


class ResourceBookingRuleBookingsPerUserInline(admin.TabularInline):
    model = ResourceBookingRuleBookingsPerUser
    verbose_name = _('Resource Booking Rule Bookings Per User')
    verbose_name_plural = _('Resource Booking Rules Bookings Per User')
    extra = 1


@admin.register(Resource)
class ResourceAdmin(CreatedAndModifiedByReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        'name',
        'type',
        'responsible_unit',
        'location',
        'contact',
        'created_by'
    )
    list_select_related = (
        'created_by',
    )
    list_filter = (
        ('type', ChoiceDropdownFilter),
        ('general_usage_setting', ChoiceDropdownFilter),
        ('location', DropdownFilter),
        is_null_filter('study_room_info', 'Is Study Room'),
    )
    search_fields = (
        'name',
        'description',
        'responsible_unit',
        'location',
        'contact',
        "created_by__username",
        "created_by__email",
    )
    inlines = (
        ResourceBookingRuleMinimumDurationInline,
        ResourceBookingRuleMaximumDurationInline,
        ResourceBookingRuleBookableHoursInline,
        ResourceBookingRuleMinimumTimeBeforeInline,
        ResourceBookingRuleMaximumTimeBeforeInline,
        ResourceBookingRuleTimeBetweenInline,
        ResourceBookingRuleBookingsPerUserInline,
        ModelPrivilegeInline,
    )
    actions = [
        make_general_usage_setting_global,
        make_general_usage_setting_groups,
        make_type_room,
        make_type_labeq,
        make_type_offeq,
        make_type_itres,
    ]
    autocomplete_fields = ('projects', 'usage_setting_selected_user_groups',)


@admin.register(UserStorageLimit)
class UserStorageLimitAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'storage_megabyte',
        'comment',
    )
    raw_id_fields = ('user',)
    search_fields = (
        'user__username',
        'user__email',
        'user__userprofile__last_name',
        'storage_megabyte',
        'comment',
    )
    list_filter = (
        ('storage_megabyte', DropdownFilter),
    )
