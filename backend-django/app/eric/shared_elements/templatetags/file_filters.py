#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.template.defaultfilters import register


@register.filter
def file_extension(file):
    parts = file.name.split(".")
    if len(parts) > 1:
        last_index = len(parts) - 1
        return parts[last_index]
    else:
        return ""
