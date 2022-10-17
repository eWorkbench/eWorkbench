#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from unittest import TestCase

from eric.jwt_auth.jwt_utils import add_url_params, strip_url_params


class UtilsTestCase(TestCase):
    def test_strip_url_params(self):
        self._assert_strip_url_params_result(
            "https://www.workbench.local/some/directory/file.ext?param1=1&param2=abc&q=test%20test",
            "https://www.workbench.local/some/directory/file.ext",
        )

        self._assert_strip_url_params_result(
            "https://www.workbench.local/some/directory/?param1=1&param2=abc&q=test%20test",
            "https://www.workbench.local/some/directory/",
        )

        self._assert_strip_url_params_result(
            "workbench.local/some/directory/file?q=s=test%20test&q1=&q2=&flag&", "workbench.local/some/directory/file"
        )

        self._assert_strip_url_params_result(
            "workbench.local/some/directory/my-file", "workbench.local/some/directory/my-file"
        )

        self._assert_strip_url_params_result("workbench.local", "workbench.local")

        self._assert_strip_url_params_result("?q1=1&q2=somevalue", "")

        self._assert_strip_url_params_result("", "")

    def _assert_strip_url_params_result(self, input, expected_result):
        actual_result = strip_url_params(input)
        self.assertEqual(expected_result, actual_result)

    def test_add_url_params(self):
        self._assert_add_url_params_result(
            "workbench.local", params={"q1": "abc"}, expected_result="workbench.local?q1=abc"
        )

        self._assert_add_url_params_result(
            "workbench.local", params={"q1": "abc", "q2": "def"}, expected_result="workbench.local?q1=abc&q2=def"
        )

        self._assert_add_url_params_result(
            "workbench.local?abc=def",
            params={"q1": "abc", "q2": "def"},
            expected_result="workbench.local?abc=def&q1=abc&q2=def",
        )

        self._assert_add_url_params_result("workbench.local", params={}, expected_result="workbench.local")

        self._assert_add_url_params_result("workbench.local?q=x", params={}, expected_result="workbench.local?q=x")

        self._assert_add_url_params_result("", params={}, expected_result="")

        self._assert_add_url_params_result("?q=1&p=2", params={}, expected_result="?q=1&p=2")

        self._assert_add_url_params_result("?q=a&p=2", params={"q": "b"}, expected_result="?q=a&p=2&q=b")

    def _assert_add_url_params_result(self, url, params, expected_result):
        actual_result = add_url_params(url, **params)
        self.assertEqual(expected_result, actual_result)
