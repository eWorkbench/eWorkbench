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
    input_str = input_str.replace(u"\n", u"<br/>")

    return clean_html(input_str, strip_unsafe=True)


def convert_html_to_text(input_str):
    # remove all existing newlines
    input_str = input_str.replace(u"\n", u"")
    # convert line breaks to newlines
    input_str = input_str.replace(u"<br>", u"\n")
    input_str = input_str.replace(u"<br/>", u"\n")
    input_str = input_str.replace(u"<br />", u"\n")
    input_str = input_str.replace(u"&nbsp;", u" ")

    # strip all html tags
    soup = BeautifulSoup(input_str, "html.parser")

    return soup.get_text()


def migrate_note_text_to_html(apps, schema_editor):
    Note = apps.get_model('shared_elements', 'Note')

    with disable_permission_checks(Note):
        for note in Note.objects.all():
            note.content = convert_text_to_html(note.content)
            note.save()


def migrate_note_html_to_text(apps, schema_editor):
    Note = apps.get_model('shared_elements', 'Note')

    with disable_permission_checks(Note):
        for note in Note.objects.all():
            note.content = convert_html_to_text(note.content)
            note.save()


def migrate_task_description_to_html(apps, schema_editor):
    Task = apps.get_model('shared_elements', 'Task')

    with disable_permission_checks(Task):
        for task in Task.objects.all():
            task.description = convert_text_to_html(task.description)
            task.save()


def migrate_task_html_to_description(apps, schema_editor):
    Task = apps.get_model('shared_elements', 'Task')

    with disable_permission_checks(Task):
        for task in Task.objects.all():
            task.description = convert_html_to_text(task.description)
            task.save()


def migrate_meeting_text_to_html(apps, schema_editor):
    Meeting = apps.get_model('shared_elements', 'Meeting')

    with disable_permission_checks(Meeting):
        for meeting in Meeting.objects.all():
            meeting.text = convert_text_to_html(meeting.text)
            meeting.save()


def migrate_meeting_html_to_text(apps, schema_editor):
    Meeting = apps.get_model('shared_elements', 'Meeting')

    with disable_permission_checks(Meeting):
        for meeting in Meeting.objects.all():
            meeting.text = convert_html_to_text(meeting.text)
            meeting.save()


def migrate_file_description_to_html(apps, schema_editor):
    File = apps.get_model('shared_elements', 'File')

    with disable_permission_checks(File):
        for file in File.objects.all():
            file.description = convert_text_to_html(file.description)
            file.save()


def migrate_file_html_to_description(apps, schema_editor):
    File = apps.get_model('shared_elements', 'File')

    with disable_permission_checks(File):
        for file in File.objects.all():
            file.description = convert_html_to_text(file.description)
            file.save()
