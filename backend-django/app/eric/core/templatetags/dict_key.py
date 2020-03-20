#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""
This is a template tag filter used for the export of LabBooks as we need to handle data in a dict there
"""
from django import template

register = template.Library()


@register.filter(name='dict_key')
def dict_key(d, k):
    # Returns the given key from a dictionary.
    return d[k]
