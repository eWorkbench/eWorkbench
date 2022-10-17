#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import base64
import datetime
import imghdr
import io
import os
import re
import unicodedata
from mimetypes import guess_extension, guess_type

from django.utils.http import urlquote

from bs4 import BeautifulSoup
from PIL import Image


def get_rgb_rgba_pattern():
    # From https://dev.to/taufik_nurrohman/match-valid-rgb-rgba-color-string-using-range-pattern-3142
    # Modified by MPO to allow "1.0" values too and not only "1".
    return (
        r"(?:rgb\(\s*(\d|[1-9]\d|1\d{2}|2[0-4]\d|2[0-5]{2})\s*,\s*(\d|[1-9]\d|1\d{2}|2[0-4]\d|2[0-5]{2})\s*,\s*(\d"
        r"|[1-9]\d|1\d{2}|2[0-4]\d|2[0-5]{2})\s*\)|rgba\(\s*(\d|[1-9]\d|1\d{2}|2[0-4]\d|2[0-5]{2})\s*,\s*(\d|[1-9]"
        r"\d|1\d{2}|2[0-4]\d|2[0-5]{2})\s*,\s*(\d|[1-9]\d|1\d{2}|2[0-4]\d|2[0-5]{2})\s*,\s*([01]|[01]?\.\d+)\s*\))"
    )


def rfc5987_content_disposition(file_name, disposition_type="attachment"):
    """
    Proccesses a filename that might contain unicode data, and returns it as a proper rfc 5987 compatible header
    :param file_name:
    :param disposition_type: either "attachment" or "inline"
    :return:
    """
    ascii_name = unicodedata.normalize("NFKD", file_name).encode("ascii", "ignore").decode()
    header = f'{disposition_type}; filename="{ascii_name}"'
    if ascii_name != file_name:
        quoted_name = urlquote(file_name)
        header += f"; filename*=UTF-8''{quoted_name}"

    return header


def convert_html_to_text(html):
    """
    Converts HTML to text, creating linebreaks for <br> and <p> tags.
    "Forked" from django_cleanhtmlfield.helpers.convert_html_to_text().
    """
    # remove all existing newlines
    html = html.replace("\n", "")

    # add line breaks for paragraphs
    html = html.replace("</p>", "</p>\n")

    # convert line breaks to newlines
    html = html.replace("<br>", "\n")
    html = html.replace("<br/>", "\n")
    html = html.replace("<br />", "\n")
    html = html.replace("&nbsp;", " ")

    # strip all html tags
    soup = BeautifulSoup(html, "html.parser")

    return soup.get_text()


def decode_base64_with_padding_correction(data, altchars=b"+/"):
    """
    Decode base64 and repair missing padding.

    :param data: Base64 data as an ASCII byte string
    :param altchars: Specifies the alternative alphabet used instead of the + and / characters
    :returns: The decoded byte string.
    """
    data = re.sub(rb"[^a-zA-Z0-9%s]+" % altchars, b"", data)  # normalize
    missing_padding = len(data) % 4
    if missing_padding:
        data += b"=" * (4 - missing_padding)

    return base64.b64decode(data, altchars)


def guess_extension_for_file_header(encoded_base64_string):
    """
    Parses the file header and returns the correct extension for it.

    :param encoded_base64_string: Base64 encoded string for file
    :returns: File extension string
    """
    # Determine the correct file extension by testing the file itself in case the mime type from the
    # src="" attribute is wrong and the extension can't be safely guessed by that factor.
    # For that we need the first 44 characters of the encoded base64 string which determines the
    # encoding of the file in question. It basically represents the file header which gets analyzed.
    file_header_sample = encoded_base64_string[:44]
    file_extension = None
    for file_test in imghdr.tests:
        file_extension = file_test(file_header_sample, None)
        if file_extension:
            file_extension = f".{file_extension}"
            break

    return file_extension


def guess_extension_for_file(encoded_base64_string, mime_type):
    """
    Guess the file extension by parsing the header or the mime type.

    :param encoded_base64_string: Base64 encoded string
    :param mime_type: Generic MIME type
    :returns: File extension string
    """
    file_extension = guess_extension_for_file_header(encoded_base64_string)
    if not file_extension:
        file_extension = guess_extension(mime_type)

    return file_extension


def get_base64_image_references(data):
    """
    Matches base64 image references and returns them as regex matches.

    :param data: String with HTML content
    :returns: Regex matches for base64 references.
    """
    if type(data) is not str:
        return []

    # This regular expression searches for all important attributes it can find.
    # It uses a positive look forward in case the attributes are placed in the wrong order.
    regex = (
        r"<img\b(?=[^<>]*\s+src=\"(data:(.+?);base64,(.+?))\")(?=[^<>]*\s+title=\"(.*?)\")?"
        r"(?=[^<>]*\s+alt=\"(.*?)\")?[^<>]+>"
    )

    return re.finditer(regex, data, re.IGNORECASE)


def extract_image_attributes_for_regex_match(regex_match):
    """
    Extracts the attributes for an image from the regex match.

    :param regex_match: Image match
    :returns: Dictionary with image attributes as key value pairs.
    """
    full_base64_data = regex_match.group(1)
    if full_base64_data:
        full_base64_data = full_base64_data.strip()

    mime_type = regex_match.group(2)
    if mime_type:
        mime_type = mime_type.strip()

    base64_image_string = regex_match.group(3)
    if base64_image_string:
        base64_image_string = base64_image_string.strip()

    title = regex_match.group(4)
    if title:
        title = title.strip()

    alt = regex_match.group(5)
    if alt:
        alt = alt.strip()

    return {
        "full_base64_data": full_base64_data,
        "mime_type": mime_type,
        "base64_image_string": base64_image_string,
        "title": title,
        "alt": alt,
    }


def create_file_name_for_image_reference(image_attributes, file_extension):
    """
    Create the file name for an image reference found by the regex.

    :param image_attributes: Dictionary with all image attributes
    :param file_extension: Extension for file
    :returns: File name for image reference
    """
    file_name_without_extension = ""

    if type(image_attributes) is dict:
        # Usually the alt or title attributes have the exact file name in them.
        # We would like to get rid of the file extension and just use the base name.
        if image_attributes.get("title"):
            file_name_without_extension = os.path.splitext(image_attributes["title"])[0]
        elif image_attributes.get("alt"):
            file_name_without_extension = os.path.splitext(image_attributes["alt"])[0]

    # use the current time stamp as the file name if neither the title nor the alt attribute holds a value
    if not file_name_without_extension:
        file_name_without_extension = f"image_file_{datetime.datetime.now()}"

    return "{}.{}".format(file_name_without_extension, file_extension.lstrip("."))


def convert_base64_image_strings_to_file_references(data):
    """
    Parse string, find base64 references and convert these to binary objects.
    Optionally byte objects are stored on the hard drive.

    :param data: String with base64 references
    :param file_path: Optional path for the location the images files are saved to
    :returns: The string with replaced base64 references.
    """
    image_references = []

    matches = get_base64_image_references(data)
    for match in matches:
        image_attributes = extract_image_attributes_for_regex_match(match)
        base64_ascii_string = image_attributes["base64_image_string"].encode("ascii")

        file_extension = guess_extension_for_file(
            decode_base64_with_padding_correction(base64_ascii_string), image_attributes["mime_type"]
        )
        file_name = create_file_name_for_image_reference(image_attributes, file_extension)
        mime_type = guess_type(file_name)[0]

        decoded_base64_image_string = decode_base64_with_padding_correction(base64_ascii_string)
        binary_image_blob = io.BytesIO(decoded_base64_image_string)

        # get the correct image dimensions as we need them in the database and reset the image cursor afterwards
        image = Image.open(binary_image_blob)
        image_width, image_height = image.size
        binary_image_blob.seek(0)

        image_references.append(
            {
                "file_name": file_name,
                "width": image_width,
                "height": image_height,
                "base64": image_attributes["full_base64_data"],
                "binary": binary_image_blob,
                "mime_type": mime_type,
            }
        )

    return image_references


def remove_none_values_from_dict(data):
    """
    Removes all entries from a dict which contain None values.

    :param data: Dict with the desired data
    :returns: Dict without None values
    """
    return {key: value for key, value in data.items() if value is not None}
