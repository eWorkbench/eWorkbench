#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from abc import abstractmethod
from django.contrib.postgres.fields.jsonb import KeyTransform, KeyTextTransform
from django.db.models import F, Q, Value, ExpressionWrapper, FloatField
from django.db.models.functions import Cast
from django.utils.dateparse import parse_datetime, parse_date

from eric.metadata.models.models import MetadataField
from eric.metadata.rest.errors import InvalidFieldInputError, InvalidOperatorError
from eric.metadata.utils import KeyDecimalTransform


class MetadataQuerySetFilterMethod:
    @abstractmethod
    def filter(self, queryset, values, operator):
        pass


class NumberFilterMethod(MetadataQuerySetFilterMethod):
    def filter(self, queryset, values, operator):
        value = values.get('value', None)
        if value is None:
            raise InvalidFieldInputError()

        try:
            float_value = float(value)
        except (ValueError, TypeError):
            raise InvalidFieldInputError()

        if operator == '=':
            return queryset.filter(values__value=float_value)

        elif operator == '<':
            return queryset.filter(values__value__lt=float_value)

        elif operator == '<=':
            return queryset.filter(values__value__lte=float_value)

        elif operator == '>':
            return queryset.filter(values__value__gt=float_value)

        elif operator == '>=':
            return queryset.filter(values__value__gte=float_value)

        else:
            raise InvalidOperatorError()


class TextFilterMethod(MetadataQuerySetFilterMethod):
    def filter(self, queryset, values, operator):
        # allow equality operator only
        if operator != '=':
            raise InvalidOperatorError()

        value = values.get('value', '')
        if value == '':
            raise InvalidFieldInputError()

        queryset = queryset \
            .annotate(text_value=KeyTextTransform('value', 'values')) \
            .filter(text_value__icontains=value)

        return queryset


class FractionFilterMethod(MetadataQuerySetFilterMethod):
    def filter(self, queryset, values, operator):
        numerator = values.get('numerator', None)
        denominator = values.get('denominator', None)
        if numerator is None or denominator is None:
            raise InvalidFieldInputError()

        try:
            numerator = float(numerator)
            denominator = float(denominator)
        except ValueError:
            raise InvalidFieldInputError()

        if denominator == 0:
            raise InvalidFieldInputError()

        # Numerator and denominator must be transformed to decimals, otherwise the SQL division will return an integer.
        # The input fraction must be computed in SQL, to avoid problems caused by different precision levels.
        queryset = queryset \
            .annotate(numerator=Cast(KeyTextTransform("numerator", "values"), FloatField())) \
            .annotate(denominator=Cast(KeyTextTransform("denominator", "values"), FloatField())) \
            .filter(~Q(denominator=0)) \
            .annotate(fraction=F('numerator') / F('denominator')) \
            .annotate(input_fraction=ExpressionWrapper(Value(numerator) / Value(denominator),
                                                       output_field=FloatField()))

        if operator == '=':
            return queryset.filter(fraction=F('input_fraction'))

        elif operator == '<':
            return queryset.filter(fraction__lt=F('input_fraction'))

        elif operator == '<=':
            return queryset.filter(fraction__lte=F('input_fraction'))

        elif operator == '>':
            return queryset.filter(fraction__gt=F('input_fraction'))

        elif operator == '>=':
            return queryset.filter(fraction__gte=F('input_fraction'))

        else:
            raise InvalidOperatorError()


class GPSFilterMethod(MetadataQuerySetFilterMethod):
    def filter(self, queryset, values, operator):
        if operator != '=':
            raise InvalidOperatorError()

        x = values.get('x', '')
        y = values.get('y', '')

        if x == '' and y == '':
            raise InvalidFieldInputError()

        return queryset \
            .annotate(x=KeyTransform('x', 'values')) \
            .annotate(y=KeyTransform('y', 'values')) \
            .filter(x__iexact=x) \
            .filter(y__iexact=y)


class SelectionFilterMethod(MetadataQuerySetFilterMethod):
    def filter(self, queryset, values, operator):
        if operator != '=':
            raise InvalidOperatorError()

        if not values:
            raise InvalidFieldInputError()

        answers = values.get('answers', None)
        single_selected = values.get('single_selected', None)
        custom_input = values.get('custom_input', None)

        # Needed if a user reselects the default value
        if single_selected == '':
            raise InvalidFieldInputError()

        # Iterate over answers to delete selected: false values.
        # If a user selects and unselects a checkbox the selected: false value is set, which is not in the db
        if not single_selected:
            for answer in answers:
                selected = answer.get('selected', None)
                if selected is False:
                    answer.pop('selected')

        if answers and custom_input:
            return queryset \
                .filter(values__answers=answers) \
                .filter(values__custom_input__icontains=custom_input)
        elif answers and not custom_input:
            return queryset.filter(values__answers=answers)
        elif single_selected and custom_input:
            return queryset \
                .filter(values__single_selected=single_selected) \
                .filter(values__custom_input__icontains=custom_input)
        elif single_selected and not custom_input:
            return queryset.filter(values__single_selected=single_selected)


# this is actually the Filter for Datetime not Date, which is found in RealDateFilterMethod
class DateFilterMethod(MetadataQuerySetFilterMethod):
    def filter(self, queryset, values, operator):
        date = values.get('value', None)
        if date is None:
            raise InvalidFieldInputError()

        try:
            date_value = parse_datetime(date).isoformat()
        except (ValueError, TypeError):
            raise InvalidFieldInputError()

        # Truncate the isoformated date_value string from 2019-04-03T10:58:00+00:00 to 2019-04-03T10:58
        date_value_truncated = date_value[:16]

        if operator == '=':
            # Exact match when the value in the db starts with the truncated input value.
            return queryset.filter(values__value__startswith=date_value_truncated)

        elif operator == '<':
            # This works as before. The string comparison stops at the latest when a lower minute value is found.
            return queryset.filter(values__value__lt=date_value)

        elif operator == '<=':
            # Using Q to filter for a lower value OR an exact match using the truncated input value.
            return queryset.filter(Q(values__value__lt=date_value) | Q(values__value__startswith=date_value_truncated))

        elif operator == '>':
            # Excluding the truncated input value to avoid exact (=) matches.
            return queryset.filter(values__value__gt=date_value).exclude(
                values__value__startswith=date_value_truncated)

        elif operator == '>=':
            # Using Q to filter for a greater value OR an exact match using the truncated input value.
            return queryset.filter(Q(values__value__gt=date_value) | Q(values__value__startswith=date_value_truncated))

        else:
            raise InvalidOperatorError()


class RealDateFilterMethod(MetadataQuerySetFilterMethod):
    def filter(self, queryset, values, operator):
        date = values.get('value', None)
        if date is None:
            raise InvalidFieldInputError()

        try:
            date_value = parse_date(date).isoformat()
        except (ValueError, TypeError):
            raise InvalidFieldInputError()

        if operator == '=':
            # Exact match when the value in the db starts with the truncated input value.
            return queryset.filter(values__value__startswith=date_value)

        elif operator == '<':
            # This works as before. The string comparison stops at the latest when a lower minute value is found.
            return queryset.filter(values__value__lt=date_value)

        elif operator == '<=':
            # Using Q to filter for a lower value OR an exact match using the truncated input value.
            return queryset.filter(Q(values__value__lt=date_value) | Q(values__value__startswith=date_value))

        elif operator == '>':
            # Excluding the truncated input value to avoid exact (=) matches.
            return queryset.filter(values__value__gt=date_value).exclude(values__value__startswith=date_value)

        elif operator == '>=':
            # Using Q to filter for a greater value OR an exact match using the truncated input value.
            return queryset.filter(Q(values__value__gt=date_value) | Q(values__value__startswith=date_value))

        else:
            raise InvalidOperatorError()


class BooleanFilterMethod(MetadataQuerySetFilterMethod):
    def filter(self, queryset, values, operator):
        value = values.get('value', None)

        if operator == '=':
            return queryset.filter(values__value=bool(value))
        else:
            raise InvalidOperatorError()


class MetadataQuerySetFilter:
    method = None

    def __init__(self, field):
        self.field = field
        base_type = self.field.base_type

        if base_type in [
            MetadataField.BASE_TYPE_WHOLE_NUMBER,
            MetadataField.BASE_TYPE_DECIMAL_NUMBER,
            MetadataField.BASE_TYPE_CURRENCY,
            MetadataField.BASE_TYPE_PERCENTAGE,
            MetadataField.BASE_TYPE_TIME,  # stored as sum of minutes
        ]:
            self.method = NumberFilterMethod()

        elif base_type == MetadataField.BASE_TYPE_TEXT:
            self.method = TextFilterMethod()

        elif base_type == MetadataField.BASE_TYPE_FRACTION:
            self.method = FractionFilterMethod()

        elif base_type == MetadataField.BASE_TYPE_GPS:
            self.method = GPSFilterMethod()

        elif base_type == MetadataField.BASE_TYPE_SELECTION:
            self.method = SelectionFilterMethod()

        elif base_type == MetadataField.BASE_TYPE_DATE:
            self.method = DateFilterMethod()

        elif base_type == MetadataField.BASE_TYPE_REAL_DATE:
            self.method = RealDateFilterMethod()

        elif base_type == MetadataField.BASE_TYPE_CHECKBOX:
            self.method = BooleanFilterMethod()

    def filter(self, queryset, values, operator):
        if self.method is None:
            raise NotImplementedError('No filter method defined for {}'.format(self.field.base_type))

        if values is None:
            raise InvalidFieldInputError()

        return self.method.filter(queryset, values, operator)
