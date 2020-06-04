#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import fields
from django.utils.translation import gettext_lazy as _
from rest_framework.serializers import ModelSerializer
from django_cleanhtmlfield.fields import HTMLField
from django_cleanhtmlfield.helpers import clean_html


class RestHtmlField(fields.CharField):
    default_error_messages = {
        'invalid': _('"{input}" is not a valid html.')
    }
    default_empty_html = False
    initial = False

    def __init__(self, **kwargs):
        super(HTMLField, self).__init__(**kwargs)

    def to_internal_value(self, data):
        return clean_html(data, strip_unsafe=True)


ModelSerializer.serializer_field_mapping[HTMLField] = RestHtmlField
