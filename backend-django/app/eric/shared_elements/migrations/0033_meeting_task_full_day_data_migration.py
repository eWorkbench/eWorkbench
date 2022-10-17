# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from datetime import time

from django.db import migrations

from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


def set_full_day_according_to_times(apps, schema_editor):
    set_full_day_according_to_times_for_meetings(apps, schema_editor)
    set_full_day_according_to_times_for_tasks(apps, schema_editor)


def set_full_day_according_to_times_for_meetings(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    Meeting = apps.get_model("shared_elements", "Meeting")

    with disable_permission_checks(Meeting):
        # first get all entries that are full days
        all_full_day_entries = Meeting.objects.using(db_alias).filter(
            date_time_start__hour=0,
            date_time_start__minute=0,
            date_time_end__hour=23,
            date_time_end__minute=59,
        )
        # then update them
        all_full_day_entries.update(
            full_day=True
        )

    RevisionModelMixin.set_enabled(True)


def set_full_day_according_to_times_for_tasks(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    Task = apps.get_model("shared_elements", "Task")

    with disable_permission_checks(Task):
        # first get all entries that are full days
        all_full_day_entries = Task.objects.using(db_alias).filter(
            start_date__hour=0,
            start_date__minute=0,
            due_date__hour=23,
            due_date__minute=59,
        )
        # then update them
        all_full_day_entries.update(
            full_day=True
        )

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0032_add_full_day_boolean_flag_to_meeting_and_task'),
    ]

    operations = [
        migrations.RunPython(set_full_day_according_to_times, migrations.RunPython.noop),
    ]
