#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals
from bs4 import BeautifulSoup
from django_cleanhtmlfield.helpers import clean_html

from eric.core.models import disable_permission_checks


def convert_text_to_html(input_str):
    # convert newlines to line breaks
    input_str = "<p>" + input_str + "</p>"

    soup = BeautifulSoup(input_str, "html.parser")
    input_str = soup.encode_contents(encoding="utf8").decode("utf8")
    input_str = input_str.replace("\n", "<br/>")

    return clean_html(input_str, strip_unsafe=True)


def convert_html_to_text(input_str):
    # remove all existing newlines
    input_str = input_str.replace("\n", "")
    # convert line breaks to newlines
    input_str = input_str.replace("<br>", "\n")
    input_str = input_str.replace("<br/>", "\n")
    input_str = input_str.replace("<br />", "\n")
    input_str = input_str.replace("&nbsp;", " ")

    # strip all html tags
    soup = BeautifulSoup(input_str, "html.parser")

    return soup.get_text()


def migrate_project_description_to_html(apps, schema_editor):
    Project = apps.get_model('projects', 'Project')

    with disable_permission_checks(Project):
        for project in Project.objects.all():
            project.description = convert_text_to_html(project.description)
            project.save()


def migrate_project_html_to_description(apps, schema_editor):
    Project = apps.get_model('projects', 'Project')

    with disable_permission_checks(Project):
        for project in Project.objects.all():
            project.description = convert_html_to_text(project.description)
            project.save()
