#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from datetime import timedelta, datetime

from django import forms
from django.core.exceptions import ValidationError
from django.db.models.constants import LOOKUP_SEP
from django.forms.widgets import NullBooleanSelect
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _

from django_filters.rest_framework import FilterSet
from django_filters import Filter
from django_filters.fields import Lookup
from django_filters import filters as django_filters
from django_userforeignkey.request import get_current_user


class BaseFilter(FilterSet):
    """ Provides 'basic' comperator lists for
        - Numbers
        - Strings
        - Foreign Keys
        - Choices
    """
    NULLABLE_COMPERATORS = ('isnull', )
    NUMBER_COMPERATORS = ('lt', 'lte', 'gt', 'gte', 'exact', )  # <, > and =
    DATE_COMPERATORS = NUMBER_COMPERATORS
    FOREIGNKEY_COMPERATORS = ('exact', )  # =
    FOREIGNKEY_NULLABLE_COMPERATORS = FOREIGNKEY_COMPERATORS + NULLABLE_COMPERATORS
    STRING_COMPERATORS = ('exact', 'icontains',)  # = and icontains
    CHOICE_COMPERATORS = FOREIGNKEY_COMPERATORS  # for choices


class ListFilter(Filter):
    """
    A custom filter which allows more than one value to be provided in a list
    """
    def filter(self, qs, value):
        value_list = value.split(u',')
        return super(ListFilter, self).filter(qs, Lookup(value_list, 'in'))


class RecursiveProjectsListFilter(Filter):
    """
    A custom filter which gets all the sub-projects of a project and adds those to the filter
    """
    def filter(self, qs, value):
        from eric.projects.models import Project
        project = Project.objects.get(pk=value)
        return super(RecursiveProjectsListFilter, self).filter(qs, Lookup(project.project_tree, 'in'))


class BooleanDefaultField(forms.BooleanField):
    """
    Boolean Field with a default parameter (False)
    see https://github.com/carltongibson/django-filter/issues/322
    """
    def clean(self, value):
        if value is None:
            return False
        return super(BooleanDefaultField, self).clean(value)


class BooleanDefaultFilter(django_filters.BooleanFilter):
    """
    Boolean Filter which uses a Boolean Default Field (always false)
    see https://github.com/carltongibson/django-filter/issues/322
    """
    field_class = BooleanDefaultField


class BetterBooleanSelect(NullBooleanSelect):
    """
    Djangos NullBooleanSelect does not evaluate 'true' to True, and not 'false' to False
    This overwritten NullBooleanSelect allows that
    See https://code.djangoproject.com/ticket/22406#comment:3
    """
    def value_from_datadict(self, data, files, name):
        value = data.get(name)
        return {
            '2': True,
            True: True,
            'true': True,  # added, as NullBooleanSelect does not do that
            'True': True,
            '3': False,
            'false': False,  # added, as NullBooleanSelect does not do that
            'False': False,
            False: False,
        }.get(value)


class BetterBooleanField(forms.NullBooleanField):
    """
    Better Boolean Field that also evalutes 'false' to False and 'true' to True
    """
    widget = BetterBooleanSelect

    def clean(self, value):
        return super(BetterBooleanField, self).clean(value)


class BetterBooleanFilter(django_filters.BooleanFilter):
    """
    This boolean filter allows evaluating 'true' and 'false'
    """
    field_class = BetterBooleanField


class RecentlyModifiedByMeFilter(Filter):
    """
    A custom filter which returns a list of elements which are modified by the current user in a specific date range
    """

    def __init__(self, *args, **kwargs):
        kwargs['label'] = _("Modified by me since (in days)")
        super(RecentlyModifiedByMeFilter, self).__init__(*args, **kwargs)

    def filter(self, qs, value):
        # convert string to int and when the string is no valid integer than throw an exception
        try:
            value = int(value)
        except:
            raise ValidationError({
                'recently_modified_by_me': ValidationError(
                    _("The parameter is not an integer"),
                    params={'recently_modified_by_me': value},
                    code='invalid'
                )
            })

        # check if the parameter is greater than 0
        if value < 0:
            raise ValidationError({
                'recently_modified_by_me': ValidationError(
                    _("The parameter is smaller than 0"),
                    params={'recently_modified_by_me': value},
                    code='invalid'
                )})

        # calculates the first day of the date range because the query search for entries with the date greater than
        # the first_day
        # hours, minutes and seconds are removed because a day starts at 00:00:00

        today = timezone.now()
        start = datetime(today.year, today.month, today.day, tzinfo=today.tzinfo)
        first_day = start - timedelta(days=value)

        return qs.filter(
            changesets__user=get_current_user(),
            changesets__date__gte=first_day
        )
