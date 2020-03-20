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
    Project = apps.get_model("projects", "Project")
    ContentType = apps.get_model("contenttypes", "ContentType")

    # create a new group user
    Group.objects.using(db_alias).bulk_create(
        [
            Group(name="User"),
            Group(name="External")
        ]
    )

    # get content type of projects.Project
    content_type = ContentType.objects.using(db_alias).get(
        app_label='projects',
        model='project'
    )

    # add projects.add_project
    can_add_project_permissions = Permission.objects.using(db_alias).filter(
        codename='add_project',
        content_type=content_type
    )

    assert len(can_add_project_permissions) == 1, "Could not find permission add_project (len=%(len)s)" % { 'len': len(can_add_project_permissions) }

    Group.objects.using(db_alias).filter(name="User").first().permissions.add(
        can_add_project_permissions.first()
    )


def reverse_func(apps, schema_editor):
    """ Delete group user and external """
    db_alias = schema_editor.connection.alias

    Group = apps.get_model("auth", "Group")

    Group.objects.using(db_alias).filter(name="User").delete()
    Group.objects.using(db_alias).filter(name="External").delete()


class Migration(PermissionContentTypeApplyMigration):

    dependencies = [
        ('contenttypes', '0001_initial'),
        ('projects', '0013_updated_project_roles'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
