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
    Role = apps.get_model("projects", "Role")

    Role.objects.using(db_alias).bulk_create(
        [
            Role(name="Project Manager", default_role_on_project_create=True),
            Role(name="No Access", default_role_on_project_user_assign=True),
            Role(name="Student")
        ]
    )


def reverse_func(apps, schema_editor):
    db_alias = schema_editor.connection.alias

    # forwards_func() creates two Country instances,
    # so reverse_func() should delete them.
    Role = apps.get_model("projects", "Role")
    Role.objects.using(db_alias).filter(name="Project Manager").delete()
    Role.objects.using(db_alias).filter(name="No Access").delete()
    Role.objects.using(db_alias).filter(name="Student").delete()


class Migration(PermissionContentTypeApplyMigration):

    dependencies = [
        ('projects', '0015_role_added_flags_default_pm'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
