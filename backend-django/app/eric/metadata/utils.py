#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.postgres.fields.jsonb import KeyTextTransform, KeyTransform
from django.utils.dateparse import parse_datetime, parse_date
from django.utils.timezone import localtime
from django.utils.translation import get_language
from django.utils.translation import gettext_lazy as _

from eric.core.templatetags.date_filters import date_short
from eric.metadata.models.models import MetadataField


class NumberFormatter:
    """
    Translated from ericworkbench-frontend/app/js/services/format/numberFormatService.js
    """

    @staticmethod
    def get_decimal_separator():
        return '.' if get_language() == 'en' else ','

    @staticmethod
    def get_thousands_separator():
        return ',' if get_language() == 'en' else '.'

    @staticmethod
    def add_thousands_separator(non_decimal_value_str, separator):
        digit_count = 1
        final = ''

        start = len(non_decimal_value_str) - 1
        stop_exclusive = -1
        step = -1
        for i in range(start, stop_exclusive, step):
            if digit_count > 3 and digit_count % 3 == 1:
                final = separator + final

            final = non_decimal_value_str[i] + final
            digit_count += 1

        return final

    @classmethod
    def format(cls, number, thousands_separator=False, prefix=None, suffix=None):
        if number is None:
            return ''

        non_decimal_value = int(number)
        non_decimal_value_str = str(non_decimal_value)
        number_str = str(number)
        decimal_separator_index = number_str.find(cls.get_decimal_separator())
        has_decimals = decimal_separator_index >= 0
        decimal_value_str = number_str[decimal_separator_index + 1:] if has_decimals else '0'

        if thousands_separator:
            non_decimal_value_str = cls.add_thousands_separator(non_decimal_value_str, cls.get_thousands_separator())

        formatted_value = '{}{}{}'.format(non_decimal_value_str, cls.get_decimal_separator(), decimal_value_str) \
            if int(decimal_value_str) > 0 else non_decimal_value_str

        if prefix:
            formatted_value = '{} {}'.format(prefix, formatted_value)
        if suffix:
            formatted_value = '{} {}'.format(formatted_value, suffix)

        return formatted_value


class MetadataFormatter:
    """ Formats metadata values """

    def format(self, metadata):
        """ Builds a single-line display value for the given metadata """

        base_type = metadata.field.base_type
        type_settings = metadata.field.type_settings
        values = metadata.values

        if not values:
            return ''

        if base_type == MetadataField.BASE_TYPE_FRACTION:
            numerator = values.get('numerator', '')
            denominator = values.get('denominator', '')

            if numerator is None and denominator is None:
                return ''

            if numerator is None:
                numerator = ''

            if denominator is None:
                denominator = ''

            return '{}/{}'.format(numerator, denominator)

        elif base_type == MetadataField.BASE_TYPE_GPS:
            x = values.get('x', '')
            y = values.get('y', '')

            if not x and not y:
                return ''

            return 'X: {x}, Y: {y}'.format(**values)

        elif base_type == MetadataField.BASE_TYPE_SELECTION:
            answers = values.get('answers', '')
            single_selected = values.get('single_selected', '')
            custom_input = values.get('custom_input', '')

            if answers is None and custom_input is None or single_selected is None and custom_input is None:
                return ''

            answers_text = ''
            if answers:
                for answer in answers:
                    if answer.get('selected', ''):
                        answers_text += '☑ '
                    else:
                        answers_text += '☐ '
                    answers_text += answer['answer']
                    answers_text += '\n'
            if single_selected:
                answers_text += '☑ '
                answers_text += single_selected

            custom_input_text = ''
            if custom_input:
                custom_input_text = '\n{}'.format(custom_input)

            return '{}{}'.format(answers_text, custom_input_text)

        else:
            # every other type of metadata has a single value
            value = values['value']

            # check for None (not just for truthy value, because e.g. <False> is a valid value for checkboxes)
            if value is None:
                return ''

            if base_type == MetadataField.BASE_TYPE_TIME:
                sum_of_seconds = value

                return '{hours}:{minutes:02}'.format(
                    hours=int(sum_of_seconds / 60),
                    minutes=sum_of_seconds % 60,
                )

            elif base_type == MetadataField.BASE_TYPE_WHOLE_NUMBER:
                return NumberFormatter().format(
                    value,
                    thousands_separator=type_settings['thousands_separator'],
                )

            elif base_type == MetadataField.BASE_TYPE_DECIMAL_NUMBER:
                return NumberFormatter().format(
                    value,
                    thousands_separator=type_settings['thousands_separator'],
                )

            elif base_type == MetadataField.BASE_TYPE_CURRENCY:
                return NumberFormatter().format(
                    value,
                    thousands_separator=True,
                    prefix=type_settings['symbol']
                )

            elif base_type == MetadataField.BASE_TYPE_PERCENTAGE:
                return NumberFormatter().format(
                    value,
                    suffix='%'
                )

            elif base_type == MetadataField.BASE_TYPE_DATE:
                return date_short(localtime(parse_datetime(value)))

            elif base_type == MetadataField.BASE_TYPE_REAL_DATE:
                return date_short(localtime(parse_date(value)))

            elif base_type == MetadataField.BASE_TYPE_CHECKBOX:
                return _('Yes') if value else _('No')

        # otherwise (e.g. text field)
        return values['value']


class KeyDecimalTransform(KeyTextTransform):
    """
        KeyTransform to use decimal value of JSON data in queries.
        See https://ishan1608.wordpress.com/2018/01/05/querying-jsonfield-in-django/
        """

    def as_sql(self, compiler, connection, function=None, template=None, arg_joiner=None, **extra_context):
        key_transforms = [self.key_name]
        previous = self.lhs
        while isinstance(previous, KeyTransform):
            key_transforms.insert(0, previous.key_name)
            previous = previous.lhs
        lhs, params = compiler.compile(previous)
        if len(key_transforms) > 1:
            return "((%s %s %%s)::decimal)" % (lhs, self.nested_operator), [key_transforms] + params
        try:
            int(self.key_name)
        except ValueError:
            lookup = "'%s'" % self.key_name
        else:
            lookup = "%s" % self.key_name
        return "((%s %s %s)::decimal)" % (lhs, self.operator, lookup), params
