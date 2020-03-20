# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models

# map migration
from django_changeset.models import RevisionModelMixin

from eric.core.models import disable_permission_checks

TASK_STATE_NEW = 'NEW'
TASK_STATE_PROGRESS = 'PROG'
TASK_STATE_TEST = 'TEST'
TASK_STATE_FINISH = 'FIN'
TASK_STATE_CLOSED = 'CLOSE'
TASK_STATE_DONE = 'DONE'

TASK_STATE_MAPPING_OLD_TO_NEW = {
    TASK_STATE_NEW: TASK_STATE_NEW,
    TASK_STATE_PROGRESS: TASK_STATE_PROGRESS,
    TASK_STATE_TEST: TASK_STATE_PROGRESS,
    TASK_STATE_FINISH: TASK_STATE_DONE,
    TASK_STATE_CLOSED: TASK_STATE_DONE,
    TASK_STATE_DONE: TASK_STATE_DONE
}

TASK_STATE_MAPPING_NEW_TO_OLD = {
    TASK_STATE_NEW: TASK_STATE_NEW,
    TASK_STATE_PROGRESS: TASK_STATE_PROGRESS,
    TASK_STATE_DONE: TASK_STATE_CLOSED
}


def convert_task_state_from_old_to_new(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias

    Task = apps.get_model("shared_elements", "Task")

    with disable_permission_checks(Task):
        for task in Task.objects.all():
            task.state = TASK_STATE_MAPPING_OLD_TO_NEW[
                task.state
            ]
            task.save()

    RevisionModelMixin.set_enabled(True)


def convert_task_state_from_new_to_old(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias

    Task = apps.get_model("shared_elements", "Task")

    with disable_permission_checks(Task):
        for task in Task.objects.all():
            task.state = TASK_STATE_MAPPING_NEW_TO_OLD[
                task.state
            ]
            task.save()

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0002_note_content_to_html_content'),
    ]

    operations = [
        # add new choices
        migrations.AlterField(
            model_name='task',
            name='state',
            field=models.CharField(choices=[('NEW', 'New'), ('PROG', 'In Progress'), ('FIN', 'Finished'), ('TEST', 'Test'), ('CLOSE', 'Closed'), ('DONE', 'Done')], db_index=True, default='NEW', max_length=5, verbose_name='State of the task'),
        ),
        # convert old values to new values (and provide a reverse function)
        migrations.RunPython(convert_task_state_from_old_to_new, convert_task_state_from_new_to_old),
        # Remove old choices
        migrations.AlterField(
            model_name='task',
            name='state',
            field=models.CharField(choices=[('NEW', 'New'), ('PROG', 'In Progress'), ('DONE', 'Done')], db_index=True,
                                   default='NEW', max_length=5, verbose_name='State of the task'),
        ),
    ]
