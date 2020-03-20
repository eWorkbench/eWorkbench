# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


def forwards_func(apps, schema_editor):
    """
    Iterates over all tasks, meetings, notes, contacts, files and converts the ForeignKey relationship to project
    into a many to many relationship for projects
    :param apps:
    :param schema_editor:
    :return:
    """
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    Task = apps.get_model('projects', 'Task')
    Note = apps.get_model('projects', 'Note')
    Meeting = apps.get_model('projects', 'Meeting')
    Contact = apps.get_model('projects', 'Contact')
    File = apps.get_model('projects', 'File')

    with disable_permission_checks(Task):
        # iterate over all tasks
        for task in Task.objects.using(db_alias).all():
            if task.project:
                task.projects.add(task.project)

    with disable_permission_checks(Meeting):
        # iterate over all meetings
        for meeting in Meeting.objects.using(db_alias).all():
            if meeting.project:
                meeting.projects.add(meeting.project)

    with disable_permission_checks(Note):
        # iterate over all notes
        for note in Note.objects.using(db_alias).all():
            if note.project:
                note.projects.add(note.project)

    with disable_permission_checks(Contact):
        # iterate over all contacts
        for contact in Contact.objects.using(db_alias).all():
            if contact.project:
                contact.projects.add(contact.project)

    with disable_permission_checks(File):
        # iterate over all files
        for file in File.objects.using(db_alias).all():
            if file.project:
                file.projects.add(file.project)

    RevisionModelMixin.set_enabled(True)


def reverse_func(apps, schema_editor):
    """
    Iterate over all tasks, meetings, notes, contacts, files and takes the first projects element from each element and
     sets it on the foreign key relationship
    :param apps:
    :param schema_editor:
    :return:
    """
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    Task = apps.get_model('projects', 'Task')
    Note = apps.get_model('projects', 'Note')
    Meeting = apps.get_model('projects', 'Meeting')
    Contact = apps.get_model('projects', 'Contact')
    File = apps.get_model('projects', 'File')

    with disable_permission_checks(Task):
        # iterate over all tasks
        for task in Task.objects.using(db_alias).all():
            if task.projects.all().count() > 0:
                task.project = task.projects.all().first()
                task.save()

    with disable_permission_checks(Meeting):
        # iterate over all meetings
        for meeting in Meeting.objects.using(db_alias).all():
            if meeting.projects.all().count() > 0:
                meeting.project = meeting.projects.all().first()
                meeting.save()

    with disable_permission_checks(Note):
        # iterate over all notes
        for note in Note.objects.using(db_alias).all():
            if note.projects.all().count() > 0:
                note.project = note.projects.all().first()
                note.save()

    with disable_permission_checks(Contact):
        # iterate over all contacts
        for contact in Contact.objects.using(db_alias).all():
            if contact.projects.all().count() > 0:
                contact.project = contact.projects.all().first()
                contact.save()

    with disable_permission_checks(File):
        # iterate over all files
        for file in File.objects.using(db_alias).all():
            if file.projects.all().count() > 0:
                file.project = file.projects.all().first()
                file.save()

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0060_entity_projects_relationship'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
