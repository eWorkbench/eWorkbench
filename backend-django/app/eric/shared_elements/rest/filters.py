#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django_filters
from django.db.models.constants import LOOKUP_SEP

from eric.core.rest.filters import BaseFilter, BooleanDefaultFilter
from eric.drives.models import Drive
from eric.shared_elements.models import Contact, Task, Meeting, Note, File, ElementLabel
from eric.core.rest.filters import ListFilter, RecursiveProjectsListFilter, RecentlyModifiedByMeFilter


class FileFilter(BaseFilter):
    """ Filter for Tasks, which allows filtering for the project (foreign key) """
    class Meta:
        model = File  # File -> Directory -> Drive
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    deleted = BooleanDefaultFilter()

    projects = ListFilter(field_name='projects')

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')

    recently_modified_by_me = RecentlyModifiedByMeFilter()

    drive = django_filters.ModelChoiceFilter(field_name='directory__drive', queryset=Drive.objects.all())


class TaskFilter(BaseFilter):
    """ Filter for Tasks, which allows filtering for the project (foreign key) """
    class Meta:
        model = Task
        fields = {
            'id': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'assigned_users': BaseFilter.FOREIGNKEY_COMPERATORS,
            'state': BaseFilter.CHOICE_COMPERATORS,
            'due_date': BaseFilter.DATE_COMPERATORS,
            'start_date': BaseFilter.DATE_COMPERATORS
        }

    id = ListFilter(field_name='id', exclude=True)

    deleted = BooleanDefaultFilter()

    projects = ListFilter(field_name='projects')

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')

    state = ListFilter(field_name='state')

    recently_modified_by_me = RecentlyModifiedByMeFilter()

    @classmethod
    def get_filter_name(cls, field_name, lookup_expr):
        """
        Combine a field name and lookup expression into a usable filter name.
        Exact lookups are the implicit default, so "exact" is stripped from the
        end of the filter name.
        """
        if field_name == 'date_time_start' or field_name == 'start_date':
            field_name = 'start_date'
        elif field_name == 'date_time_end' or field_name == 'due_date':
            field_name = 'end_date'

        filter_name = LOOKUP_SEP.join([field_name, lookup_expr])

        # This also works with transformed exact lookups, such as 'date__exact'
        _exact = LOOKUP_SEP + 'exact'
        if filter_name.endswith(_exact):
            filter_name = filter_name[:-len(_exact)]

        return filter_name


class ContactFilter(BaseFilter):
    """ Filter for Contact, which allows filtering for the project (foreign key) """
    class Meta:
        model = Contact
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS
        }

    deleted = BooleanDefaultFilter()

    projects = ListFilter(field_name='projects')

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class MeetingFilter(BaseFilter):
    """ Filter for Meeting, which allows filtering by date_time and project """
    class Meta:
        model = Meeting
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'resource': BaseFilter.FOREIGNKEY_COMPERATORS,
            'attending_users': BaseFilter.FOREIGNKEY_COMPERATORS,
            'date_time_end': BaseFilter.DATE_COMPERATORS,
            'date_time_start': BaseFilter.DATE_COMPERATORS
        }

    deleted = BooleanDefaultFilter()

    projects = ListFilter(field_name='projects')

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')

    recently_modified_by_me = RecentlyModifiedByMeFilter()

    @classmethod
    def get_filter_name(cls, field_name, lookup_expr):
        """
        Combine a field name and lookup expression into a usable filter name.
        Exact lookups are the implicit default, so "exact" is stripped from the
        end of the filter name.
        """
        if field_name == 'date_time_start' or field_name == 'start_date':
            field_name = 'start_date'
        elif field_name == 'date_time_end' or field_name == 'due_date':
            field_name = 'end_date'

        filter_name = LOOKUP_SEP.join([field_name, lookup_expr])

        # This also works with transformed exact lookups, such as 'date__exact'
        _exact = LOOKUP_SEP + 'exact'
        if filter_name.endswith(_exact):
            filter_name = filter_name[:-len(_exact)]

        return filter_name


class NoteFilter(BaseFilter):
    """ Filter for Note, which allows filtering by project """
    class Meta:
        model = Note
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    deleted = BooleanDefaultFilter()

    projects = ListFilter(field_name='projects')

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class ElementLabelFilter(BaseFilter):
    """ Filter for Element Labels """
    class Meta:
        model = ElementLabel
        fields = {
            'name': BaseFilter.STRING_COMPERATORS
        }
