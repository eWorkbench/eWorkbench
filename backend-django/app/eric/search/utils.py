#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import re

from unidecode import unidecode


def convert_search_terms(search_terms):
    """
    Converts a list of search terms to a single search string and filters illegal characters.

    :param search_terms: Array of strings to search for
    :return:
    """
    # only allow -, _, . and words for our search values
    regex_strip = re.compile(r'(?!-)(?!\.)(?!_)[\W]+', re.UNICODE)
    search_terms = [unidecode(regex_strip.sub('', term)) for term in search_terms]

    return " ".join(search_terms).lower()
