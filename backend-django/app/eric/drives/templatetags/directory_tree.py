#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django import template

register = template.Library()


@register.inclusion_tag("widgets/directory_tree.html")
def directory_tree(cur_directory, all_directories):
    """
    Displays a directory tree
    :param cur_directory: the current directory
    :return:
    """
    context = {"cur_directory": cur_directory, "all_directories": all_directories}

    return context
