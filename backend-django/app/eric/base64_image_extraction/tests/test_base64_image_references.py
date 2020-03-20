#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.test import TestCase
import io

from eric.core.utils import convert_base64_image_strings_to_file_references,\
                            create_file_name_for_image_reference,\
                            extract_image_attributes_for_regex_match,\
                            get_base64_image_references,\
                            guess_extension_for_file,\
                            guess_extension_for_file_header,\
                            decode_base64_with_padding_correction


class Base64ImageReferencesTestCase(TestCase):
    def setUp(self):
        # test base64 string for a PNG image
        self.base64_string = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAA" \
                             "JcEhZcwAADsMAAA7DAcdvqGQAAA7ASURBVHhe7VxpbJxXFR1na504ie1ZvY3tWWyPl8SxYzspSdO0iWgpXQB1AV" \
                             "qiLkRJPDO2430bO16SuImzp5SWLtCFIigSCIT4g1QVJOBHgVL4gahARbHH45nxvi+Pc9/7xjEVhaZxDHLu0dOn8" \
                             "eQbNz333nPPfd+b6BgMBoPBYDAYDAaDwWAwGAwGg8FgMBgMBoPBYDAYDAaDwWAwGAwGg8FgMBiM/4q7k2992LpG" \
                             "+4Gx/IhdEyVqE379pY07Y6O0txjLjN9+1RwuNw14DG/cEX2r9h5jGdFQHDtZn9zjSexzG//x5OY9cVwKy4vbE24" \
                             "VrenBymR/eeIVtwWl0JzLXWEZEa3TiY6M4bq0ULU1UJHU47GEvcbXbsfbjOVCuNox1Wwfrk8bqLb2H03u8VqCHt" \
                             "P39nIMlgu/eSJFtDnHKAa2weo0yFGvNyHkNb2xh7vysuCtLyaJ464Jn2O8yTHSYBusRQxSer2WsMfUXbhWu4lx4" \
                             "/Dc3RbRlT3TmjXZkjnW5BhtsFMMjqIOEge8xsPpq7X7GDcIp+80iVN5c21ZM62u6UgdDNSk9Vck9rgTQkcMmeu0" \
                             "OxlLDnL9x/eYRPeW+fZsFYOplozxZsdIffpAdRp8Ua/H8odHNi3czFh6nN1vFme2io68+Y7suXbXdGvmtM853kS" \
                             "+KFxl9ZclwhQ15fBwcMNw6bMWcSZfHM8VHTnz7blzxygGk77FzcAcOqJP4V5wg/DDh6zizDZxYos4nic6cqFFs4" \
                             "hBS+ZEs3Ok3j5QndpXntTnMb+5d732AcbSgWT93UNO0b1NnNxKAeikOphrc822uiZ9GWNN9iEMyZVWcqWlBhcPB" \
                             "ksNCsB85zZxqkCc3ELr+BbEQDZkxICEaKyBiiBARYDRjMfjpcbmKJ34Rok4tU10baUiOJEvOiFEOXMkRFnTLc6J" \
                             "RsdwrS2IIvAkBA7pN9KH2A4tHR60b5QByBddiEG+OJlHzaAzWwoRXGkmJuSRBlhSdILEfo+x3sWz8ZLixftTxOU" \
                             "iqgAqAoRBxkBzRLITtDjHUAQ10g65ze89ImuAsRQgJRn0bRXntovTsg08owKwRZxAN0YASIVoLsNMUJcerkrxex" \
                             "OCpXo718D1IyqK2Dev0YkXd4nuAnF6OwUAiwKATpAriyB7vs01cyxjstk+2mAbhAqVQYVMhx08lC0RGneZqQF0F" \
                             "12NARUBujHsUC4VAQUgc8oHFbIP1aT2H02GF3qdvdBSYayjQFzYIc5sF91QIVSAFKITefOYBmgugwplzWkq5Byh" \
                             "gSDZ77G8/2VuA0uB/SkbxEu7xZlicQYVgBgUShXKn0fid0CC0IrzRDtUiLzQZLNjhNqAFW3Af0i/QfsdjOvAnyt" \
                             "yxaUd4iwCINnHOp2vqRANZREvBBVqoYlshJ6XpfrLEkOl+jwWoetEgeEW8crt4lxxJAAyBkqFtDYgK6ATFZCNkR" \
                             "jTwGijDW0A00DIY7zHvEr7RYxPh/6WAnFppzhXJM7KpVRIC0BkIlNGqD1n9lgG9WEYoZr0AAXA9BhvjV4PjhYZx" \
                             "cu7if3zSoIQAFUBsg08g/TPpyYMM6pNA64pX8YYVYA1UJEY8pqOONmJfloY1kSJl/eIi0j/EpIgXKkCpApRAFQF" \
                             "SCcq9yS0cUw60UF6TpkU9JqqeEPiWqEmL2Cya4d4die5z/MIANhHBSgjJCsAKqQCQBWAAFAFzLViFMgYlaNAoJw" \
                             "CUJ7JAbgWLLD/8yeyxLc+Iy6UiPOogEj6n91+NQAkQQu7cjny+UzWbCsqgPalUQGQoKDbdISH4U+Bk/uSxHf2iA" \
                             "u3SfZRATs0F4QF9pUEnV5wQfL5DDXh7BklQbQbYe0rT0ITfjiJm/AnwELiAxUlJvEa2N9JvOOK3D8P6pUERQYxV" \
                             "QFgX/WAhTmgNWOq2THaYFOb0iG3oTDm6m9mfCxkAIipyh1g/w5qvFgqBufkVaU/uaAirQGcKqQHA0h/CgAkKGeu" \
                             "3TUrnw+P1tsH5CTcf0RvUP8Bxsdhce5fvs8qXpXsQ/o19pH+6MDbSYKIfak/JEHyqYCyobQVkTvfkYUKmGrJmGi" \
                             "yYxIOyR3pvz6+WfvVjP+K9yryxLfvoJkL0g/nQ+ZHqX+RbAAlWvpr+lNI7GsWSD2TgQVCA8gYa7IN1aYGjyYHvO" \
                             "Yf7efjEZ8AtyVEE+kv7CK6L4J6pD+oj6g/BQDsw//IK8SH0j9feyazEAB6NO9EB1bPAwIVSSGvuZaHgP8M0PPjA" \
                             "xlkeC5Ls39R5r5KfPxI6a9yP6L+JD5S/aE/qgHIJ2KwQHNtWaoBjNTLJ2JliWG3vmBlFEB7QUzyLerlUqL7niTx" \
                             "0i7xvDT7ine6KtFH4qMHgH21/yPtv9Ifjf3IEzHZAAT0hw5GZMpHkmmhSjQA898OrJQGUJ0XLWoTfvqgfo95CSo" \
                             "6bpXu2c+niOd3ixeQ78VEN3lNUI/XMgBgXykPbI/qvUh82oGA+Mil5i9qALmik86JqicBcgRDA6BNiH6P+XLxDc" \
                             "ia/wniV0UFDumD5RbhSx2sSr10l36H8ZojYY2OKis2vFuaJV7ZLb6JZJfUE9eyzarEp3ek7lPiS/HB6EvTr/T+K" \
                             "gDK/JD6YwBWT+RdSP8Z+B95UjpcTf4n7DGUrKSnYT/Yv6nXbfKXJw7VpM632sVJl+jIevuxlK69+q+4YoqN68yL" \
                             "Bv4NOp1hlW5nQrS7SH/53uT33JnELKnNDnFJckrZLQcrCkCEemJfvk9dF4mvVmTvQTM/6L1K/eX+T2QAnqX5yzn" \
                             "eSPrTfzTZ7zG/r51TXykoiVsTKtVfcVvwvzdYmzbaYJ9qcYjOLNGVLc5sEee3ikuF4nyBOFcoLhbT03Pk+HPF4t" \
                             "kiOslzAbRKHpHX3fIKX6/luEx20E1Xuduj+i1e4M5/YR+5L9O/a4s4uY1yH8OX2oAj9c+YbLKNUvuVD8I8hoMr7" \
                             "9syv7h/c0+pEUUQrk4drk8fa3JMtjhnjmXOtrkgAnRCDfl4Mk905RJH8IjIVvhFWpJBCAgWcSpVhQKwcFWaoxjH" \
                             "a3nFzEXsK9lBANTOz6JnkJ2y98qDoUh/2oKmE+opvR7zByty/iqmIjBccZtlEaSONqIInFOtztljmXPtdD6Q7CD" \
                             "psiQIHVKLgWRQsa+2cbCIYvArIwGWFe+U3fJ+/Eh34n4pO6Q8kZ1nyn2IDwIA8XGh9862Zs34yPyM1qUPVNN3NA" \
                             "a9xhX7FOzNuzb2lhp7yyzBKutQfRrm/kmfY6o1Y/ZYFqQAckyJiYUAUJ7KGCwuBRUG4nehJhAGvEAAthPFIBd0a" \
                             "zfIgyfUcj+S++pgOkk/fUGjxTlJ39azDdSkwvz0eUy/eiBG++uuPMDWffhU/JVSE+ZMqO1wvQ1CNOFTQpQ134HO" \
                             "nEMBQIaqGJAWIQxycAWVqhpAq1YTKgwyEvRHSHaZ+OoeRT3lvmJfDr1X2YfzccH5TNLeJ3qvNVSZ3OtJGCzVO1f" \
                             "29/TutawNuyFElv7K5HBt6kh92nizjZoB6qAtc45i4JqHFoEpCoOMAcnRQhhkNVAwpKxr1KslI6So15aknthXRx" \
                             "DVrqdiXzP+cD4jtdopoHCZsTX3Jth7eO62mL5SQ6/XjBig8IcbqCFP+BzTrRkzpEUoBfSDbEpVsIZFMVD2EddIb" \
                             "zilXoBlMK5eRJa6h9wOqEcgpeWnrgvPI10/7TpA/dB4bfCdYD9Qngjxeee+lSs+H8Evv7DJj2bgTQhWpqAhj9Tb" \
                             "x6UpQj9ADOYoBtQS6NwgKVKOVCRVEHILk/iVNaEVh3yH3oxciX1ZQyQ7qCeEU+Z+Gz12J+UB+032kTr6RyMC5Ul" \
                             "+t+nDA7E30cZbtE73l8fj0JDpm6FVKYOog3obYrBQB0hSGYMszR1piqSWfIi4oE7Uqxe9Vp0WL/ARWpT4Cy0Xsg" \
                             "PLj4l3vNEB9mGIkft+jynwdOxN9+TRuCbqg6/FYTLoLUsIwpjWpI1gOGi0IQawp5EwuOg5CcXAJRNZnePMlqkNl" \
                             "mFbYZmkraR8V+WClKcdHnEcs0UOPgvqyW6S6GfJbwWT5xmqTR2osvaVJ/bAFh+My1wpuz7Xhs1RUX98NLbPbezx" \
                             "0oQcrkkbqkvDfDDWZEOSSjnKxAJ9GBSg3fPUGBAMEK3KQlaGFhi58EfqBjrkQ/MdFuYMjFpI/CkkfpMNYcbARfu" \
                             "dlPtm/1OxN/u3MH72uY1BDw1o0ptah2qpFGANEYNJHxEHgzSDGKA/08xMzEJSSFU6yFCSRsklXSzedMlzzrLTSq" \
                             "szTedtaZ8Hv1OKPp39h+cJeo1/enRTnPpL3OQ4tT16wB3f4zb5SY5SwNFQXTopEkoBzRmi5IMoOadBKNJZSpNaK" \
                             "A6Na/XOMfKXMuWdlPI+B2w+TbmN6cN16UM1lPiQnV6PZbjM+F3+8sVi7DOs/vuB2IDH0OMx03mQSoTBCkUaabCB" \
                             "vrFmx0SzE5Egp4QO0ZIx3eIgYWl14ooSmYa+0/tSanCbzzHRpLIeRjN9uAZeMwWDbq/XEvAYgwfjDvCR23+L8yX" \
                             "RwcPxMIVI0r6KpFAVhWEQBVEvdakxHSKOjB5vtlNqIyotzslmJ70A4812lAvM5XijDbyP1pHWY87AyA3q/V44ff" \
                             "OQV//m3vWc+R8HOmBiXRv11r6YUCnCYIRFgU+FZKMgkMJwSpCR4XroSdpoPbVTuoJruqar90lq4HCqrbifTjag0" \
                             "6LDe42DXsM7D8QUbuRTVp8MeTGrXr19vf9gfMBt9Hswsln85QmB8mQEI1iZDHJRHEhtEI2GEa5OGahCpqcgTiCd" \
                             "9tTKLfQRjynkNYaO6N+6a33RJqb+2rFOp3syfc1P7t7Q+/W4oNsQ9OgDHnOvx9TrNYNfDBBYfVjgusyCTMfrgNc" \
                             "c8prDEPrD8W/fF3PIuZYFZwmA7N0dv7oye93re9f/7qGNHz4R23dIHzoSHy41hGjpQXfP0/G/f2jT9/etb9m67k" \
                             "7Dav7XTpYGi08eLgZGV9MqNAxd6jqdZbXuptlF+38HCz2DwWAwGAwGg8FgMBgMBoPBYDAYDAaDwWAwGAwGg8FgM" \
                             "BgMBoPBYDBuTuh0/wQ0/UVcPUj5EwAAAABJRU5ErkJggg=="
        self.base64_ascii_string = self.base64_string.encode('ascii')
        self.full_base64_string = 'data:image/png;base64,{}'.format(self.base64_string)
        self.base64_image_tag = '<img src="{}" alt="Test_image.png" title="Test_image.png">'.format(
            self.full_base64_string
        )
        self.image_attributes = {
            'full_base64_data': self.full_base64_string,
            'mime_type': 'image/png',
            'base64_image_string': self.base64_string,
            'title': 'Test_image.png',
            'alt': 'Test_image.png',
        }

        # test HTML content with two base64 image references and test messages with line breaks in between
        self.html_content = """
            Test message.
            {}
            Another test message.
            {}
            Last test message.
        """.format(
            self.base64_image_tag,
            self.base64_image_tag
        )

    def test_decode_base64_with_padding_correction(self):
        """Correct base64 string with incorrect padding"""
        invalid_base64_string = self.base64_string.rstrip('=').encode('ascii')
        valid_base64_string = self.base64_string.encode('ascii')

        self.assertNotEqual(
            invalid_base64_string,
            valid_base64_string
        )

        self.assertEqual(
            decode_base64_with_padding_correction(invalid_base64_string),
            decode_base64_with_padding_correction(valid_base64_string)
        )

    def test_guess_extension_for_file_header(self):
        """Guess the file extension for file header"""
        file_extension = guess_extension_for_file_header(
            decode_base64_with_padding_correction(self.base64_ascii_string)
        )

        self.assertEqual(file_extension, '.png')

    def test_guess_extension_for_file(self):
        """Guess the file extension for file"""
        file_extension = guess_extension_for_file(
            decode_base64_with_padding_correction(self.base64_ascii_string),
            self.image_attributes['mime_type']
        )

        self.assertEqual(file_extension, '.png')

    def test_convert_base64_image_strings_to_file_references(self):
        """Convert base64 image strings to file references"""
        image_references = convert_base64_image_strings_to_file_references(self.html_content)
        self.assertEqual(len(image_references), 2)
        image_reference_1 = image_references[0]

        decoded_base64_image_string = decode_base64_with_padding_correction(self.base64_ascii_string)
        expected_binary_file = io.BytesIO(decoded_base64_image_string)

        self.assertEqual(image_reference_1['file_name'], 'Test_image.png')
        self.assertEqual(image_reference_1['width'], 128)
        self.assertEqual(image_reference_1['height'], 128)
        self.assertEqual(image_reference_1['base64'], self.full_base64_string)
        self.assertEqual(image_reference_1['mime_type'], self.image_attributes['mime_type'])

        with image_reference_1['binary'] as file_1:
            with expected_binary_file as file_2:
                self.assertEqual(
                    file_1.read(),
                    file_2.read()
                )

    def test_create_file_name_for_image_reference(self):
        """Create the file name for an image reference"""
        file_extension = guess_extension_for_file(
            decode_base64_with_padding_correction(self.base64_ascii_string),
            self.image_attributes['mime_type']
        )

        self.assertEqual(create_file_name_for_image_reference(self.image_attributes, file_extension), 'Test_image.png')

    def test_get_base64_image_references(self):
        """Get base64 image references from HTML content string"""
        matches = get_base64_image_references(self.html_content)
        self.assertEqual(len(tuple(matches)), 2)

        for match in matches:
            self.assertEqual(match.group(0), self.base64_image_tag)

    def test_extract_image_attributes_for_regex_match(self):
        """Extract image attributes from a regex match"""
        matches = get_base64_image_references(self.html_content)
        self.assertEqual(len(tuple(matches)), 2)

        for match in matches:
            image_attributes = extract_image_attributes_for_regex_match(match)
            self.assertEqual(image_attributes, self.image_attributes)
