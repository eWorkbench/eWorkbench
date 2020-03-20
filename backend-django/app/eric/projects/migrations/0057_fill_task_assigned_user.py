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


def forwards_func(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    User = apps.get_model('auth', 'User')
    Task = apps.get_model('projects', 'Task')
    TaskAssignedUser = apps.get_model('projects', 'TaskAssignedUser')

    # iterate over all tasks
    for task in Task.objects.using(db_alias).all():
        TaskAssignedUser.objects.using(db_alias).create(
            task=task,
            assigned_user=task.assigned_user
        )

    RevisionModelMixin.set_enabled(True)


def reverse_func(apps, schema_editor):
    db_alias = schema_editor.connection.alias


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0056_task_assigned_users'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
