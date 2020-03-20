# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
from eric.core.db.migrations import PermissionContentTypeApplyMigration


def forwards_func(apps, schema_editor):
    db_alias = schema_editor.connection.alias

    # We get the model from the versioned app registry;
    # if we directly import it, it'll be the wrong version
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    # get all content types
    drive_content_type = ContentType.objects.using(db_alias).get(
        app_label='drives',
        model='drive'
    )

    # projects.task.add_task_without_project
    can_add_drive_without_project = Permission.objects.using(db_alias).filter(
        codename='add_drive_without_project',
        content_type=drive_content_type
    )

    assert len(can_add_drive_without_project) == 1, "Could not find permission add_drive_without_project (len=%(len)s)" % {
        'len': len(can_add_drive_without_project)
    }

    # add those permissions to the group "user"
    Group.objects.using(db_alias).filter(name="User").first().permissions.add(
        can_add_drive_without_project.first(),
    )


def reverse_func(apps, schema_editor):
    """ Delete group user and external """
    db_alias = schema_editor.connection.alias

    # We get the model from the versioned app registry;
    # if we directly import it, it'll be the wrong version
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    Project = apps.get_model("projects", "Project")
    ContentType = apps.get_model("contenttypes", "ContentType")

    # get all content types
    drive_content_type = ContentType.objects.using(db_alias).get(
        app_label='drives',
        model='drive'
    )

    # projects.task.add_task_without_project
    can_add_drive_without_project = Permission.objects.using(db_alias).filter(
        codename='add_drive_without_project',
        content_type=drive_content_type
    )

    assert len(
        can_add_drive_without_project) == 1, "Could not find permission add_drive_without_project (len=%(len)s)" % {
        'len': len(can_add_drive_without_project)
    }

    # add those permissions to the group "user"
    Group.objects.using(db_alias).filter(name="User").first().permissions.remove(
        can_add_drive_without_project.first(),
    )


class Migration(PermissionContentTypeApplyMigration):

    dependencies = [
        ('drives', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
