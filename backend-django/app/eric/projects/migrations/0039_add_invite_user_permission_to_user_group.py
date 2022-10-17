# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
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

    # get content type of projects.Project
    content_type = ContentType.objects.using(db_alias).get(
        app_label='projects',
        model='project'
    )

    # add projects.add_project
    can_invite_external_user = Permission.objects.using(db_alias).filter(
        codename='invite_external_user',
        content_type=content_type
    )

    assert len(can_invite_external_user) == 1, "Could not find permission invite_external_user (len=%(len)s)" % { 'len': len(can_invite_external_user) }

    Group.objects.using(db_alias).filter(name="User").first().permissions.add(
        can_invite_external_user.first()
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

    # get content type of projects.Project
    content_type = ContentType.objects.using(db_alias).get(
        app_label='projects',
        model='project'
    )

    # add projects.add_project
    can_invite_external_user = Permission.objects.using(db_alias).filter(
        codename='invite_external_user',
        content_type=content_type
    )

    assert len(can_invite_external_user) == 1, "Could not find permission invite_external_user (len=%(len)s)" % {
        'len': len(can_invite_external_user)}

    Group.objects.using(db_alias).filter(name="User").first().permissions.remove(
        can_invite_external_user.first()
    )


class Migration(PermissionContentTypeApplyMigration):

    dependencies = [
        ('contenttypes', '0001_initial'),
        ('projects', '0038_added_invite_external_user_permission'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
