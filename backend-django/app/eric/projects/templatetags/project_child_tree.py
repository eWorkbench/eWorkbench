#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django import template

register = template.Library()


@register.simple_tag(name="projectchildtree")
def get_child_tree(project, project_names):
    project_names += f"{project.name}, "
    if project.sub_projects.exists():
        for sub in project.sub_projects.all():
            project_names = get_child_tree(sub, project_names)
    return project_names
