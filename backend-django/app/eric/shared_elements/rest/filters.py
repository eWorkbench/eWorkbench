#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django_filters
from django.db.models.constants import LOOKUP_SEP

from eric.core.rest.filters import BaseFilter, BooleanDefaultFilter, WorkbenchElementFilter, BetterBooleanFilter, \
    RecursiveProjectsListFilter
from eric.core.rest.filters import ListFilter
from eric.drives.models import Drive
from eric.shared_elements.models import Contact, Task, Meeting, Note, File, ElementLabel, CalendarAccess, Comment
from eric.dss.models import DSSContainer


class FileFilter(WorkbenchElementFilter):
    class Meta:
        model = File  # File -> Directory -> Drive
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    drive = django_filters.ModelChoiceFilter(field_name='directory__drive', queryset=Drive.objects.all())

    container = django_filters.ModelChoiceFilter(field_name='directory__drive__envelope__container',
                                                 queryset=DSSContainer.objects.all())
    projects_recursive = RecursiveProjectsListFilter(field_name='projects')


class TaskFilter(WorkbenchElementFilter):
    class Meta:
        model = Task
        fields = {
            'id': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'assigned_users': BaseFilter.FOREIGNKEY_COMPERATORS,
            'state': BaseFilter.CHOICE_COMPERATORS,
            'priority': BaseFilter.CHOICE_COMPERATORS,
            'due_date': BaseFilter.DATE_COMPERATORS,
            'start_date': BaseFilter.DATE_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    id = ListFilter(field_name='id', exclude=True)
    state = ListFilter(field_name='state')
    priority = ListFilter(field_name='priority')
    full_day = BetterBooleanFilter()
    projects_recursive = RecursiveProjectsListFilter(field_name='projects')

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


class ContactFilter(WorkbenchElementFilter):
    class Meta:
        model = Contact
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS
        }

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')


class MeetingFilter(WorkbenchElementFilter):
    class Meta:
        model = Meeting
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'resource': BaseFilter.FOREIGNKEY_COMPERATORS,
            'attending_users': BaseFilter.FOREIGNKEY_COMPERATORS,
            'date_time_end': BaseFilter.DATE_COMPERATORS,
            'date_time_start': BaseFilter.DATE_COMPERATORS
        }

        full_day = BetterBooleanFilter()
        projects_recursive = RecursiveProjectsListFilter(field_name='projects')

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

        return super().get_filter_name(field_name, lookup_expr)


class AnonymousMeetingFilter(BaseFilter):
    """ Restricted filters for anonymous meetings """

    class Meta:
        model = Meeting
        fields = {
            # Advisory: Do not allow filtering by attending_users or any other non-anonymous data
            # (Attackers could use many requests with those filters to deduce private information)
            'resource': BaseFilter.FOREIGNKEY_COMPERATORS,
            'date_time_end': BaseFilter.DATE_COMPERATORS,
            'date_time_start': BaseFilter.DATE_COMPERATORS,
        }

    deleted = BooleanDefaultFilter()

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

        return super().get_filter_name(field_name, lookup_expr)


class NoteFilter(WorkbenchElementFilter):
    class Meta:
        model = Note
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')


class CommentFilter(WorkbenchElementFilter):
    class Meta:
        model = Comment
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')


class ElementLabelFilter(BaseFilter):
    class Meta:
        model = ElementLabel
        fields = {
            'name': BaseFilter.STRING_COMPERATORS
        }


class CalendarAccessFilter(BaseFilter):
    """ Filter for Calendar Access Privileges """

    class Meta:
        model = CalendarAccess
        fields = {
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }
