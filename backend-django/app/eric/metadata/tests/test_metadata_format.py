#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.test import APITestCase

from eric.metadata.models.models import Metadata, MetadataField
from eric.metadata.utils import MetadataFormatter, NumberFormatter
from eric.projects.tests.core import AuthenticationMixin
from eric.versions.tests.helper_mixin import HelperMixin


class MetadataFormatTest(APITestCase, AuthenticationMixin, HelperMixin):
    def setUp(self):
        # set_language('en')
        pass

    def test_number_formatter_no_thousands_separator(self):
        output = NumberFormatter().format(1234567890, thousands_separator=False)
        self.assertEqual(output, "1234567890")

        output = NumberFormatter().format(1234567890.7654321, thousands_separator=False)
        self.assertEqual(output, "1234567890.7654321")

        output = NumberFormatter().format(0, thousands_separator=False)
        self.assertEqual(output, "0")

    def test_number_formatter_use_thousands_separator(self):
        output = NumberFormatter().format(1234567890, thousands_separator=True)
        self.assertEqual(output, "1,234,567,890")

        output = NumberFormatter().format(1234567890.7654321, thousands_separator=True)
        self.assertEqual(output, "1,234,567,890.7654321")

        output = NumberFormatter().format(0.0, thousands_separator=True)
        self.assertEqual(output, "0")

        output = NumberFormatter().format(0, thousands_separator=True)
        self.assertEqual(output, "0")

    def test_number_formatter_prefix(self):
        output = NumberFormatter().format(123.321, prefix="MYPREFIX")
        self.assertEqual(output, "MYPREFIX 123.321")

        output = NumberFormatter().format(0, prefix="MYPREFIX")
        self.assertEqual(output, "MYPREFIX 0")

    def test_number_formatter_suffix(self):
        output = NumberFormatter().format(123.321, suffix="MYSUFFIX")
        self.assertEqual(output, "123.321 MYSUFFIX")

        output = NumberFormatter().format(0, suffix="MYSUFFIX")
        self.assertEqual(output, "0 MYSUFFIX")

    def test_number_formatter_mixed(self):
        output = NumberFormatter().format(
            123456789.7654321, thousands_separator=True, prefix="MYPREFIX", suffix="MYSUFFIX"
        )
        self.assertEqual(output, "MYPREFIX 123,456,789.7654321 MYSUFFIX")

    def test_boolean_formatter(self):
        field = MetadataField.objects.create(
            name="MyCheckbox",
            description="...",
            base_type=MetadataField.BASE_TYPE_CHECKBOX,
            type_settings={},
        )
        self.superuser, self.token = self.create_user_and_login("superuser", is_superuser=True)

        metadata = Metadata.objects.create(field=field, entity=field, values={"value": True})
        output = MetadataFormatter().format(metadata)
        self.assertEqual(output, "Yes")

        metadata = Metadata.objects.create(field=field, entity=field, values={"value": False})
        output = MetadataFormatter().format(metadata)
        self.assertEqual(output, "No")
