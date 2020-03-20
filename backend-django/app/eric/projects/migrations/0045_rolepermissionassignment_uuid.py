# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import uuid

from django_changeset.models import RevisionModelMixin

def fill_rolepermissionassignment_uuid(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias
    RolePermissionAssignment = apps.get_model('projects', 'rolepermissionassignment')
    for obj in RolePermissionAssignment.objects.using(db_alias).all():
        obj.uuid = uuid.uuid4()
        obj.save()

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):
    """
    Change model with integer pk to UUID pk.  This migration presumes there
    are no db constraints (foreign keys) to this table.

    Note: this migration is not reversible.  See the comment above the
    `RemoveField` operation.  Further, this migration is possible in part due
    to the fact that there are currenty no foreign key restraints to this table.
    """

    dependencies = [
        ('projects', '0044_django_changeset_uuid'),
    ]

    operations = [
        migrations.AddField(
            model_name='rolepermissionassignment',
            name='uuid',
            field=models.UUIDField(null=True),
        ),
        migrations.RunPython(
            fill_rolepermissionassignment_uuid,
            migrations.RunPython.noop
        ),
        migrations.AlterField(
            model_name='rolepermissionassignment',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, serialize=False, editable=False, unique=True),
        ),
        # this RemoveField operation is irreversible, because in order to
        # recreate it, the primary key constraint on the UUIDField would first
        # have to be dropped.
        migrations.RemoveField('RolePermissionAssignment', 'id'),
        # rename uuid field to id
        migrations.RenameField(
            model_name='rolepermissionassignment',
            old_name='uuid',
            new_name='id'
        ),
        migrations.AlterField(
            model_name='rolepermissionassignment',
            name='id',
            field=models.UUIDField(primary_key=True, default=uuid.uuid4, serialize=False, editable=False, unique=True),
        ),

    ]
