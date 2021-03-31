#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, transaction
from django.db.migrations import RunPython


@transaction.atomic
def update_transaction(apps, schema_editor):
    update_roles(apps)


def update_roles(apps):
    Role = apps.get_model('projects', 'Role')
    Permission = apps.get_model('auth', 'Permission')
    RolePermissionAssignment = apps.get_model('projects', 'RolePermissionAssignment')

    # add permissions to Project Manager Role
    pman_role = Role.objects.filter(name='Project Manager').first()
    new_pman_permissions = Permission.objects.filter(codename__in=[
        'view_resource',
        'restore_resource',
        'trash_resource',
        'change_project_resource',
    ])
    for permission in new_pman_permissions:
        assignment = RolePermissionAssignment.objects.filter(role=pman_role, permission=permission)
        if not assignment.exists():
            RolePermissionAssignment.objects.create(role=pman_role, permission=permission)

    # add permissions to Project Member Role
    pmem_role = Role.objects.filter(name='Project Member').first()
    new_pmem_permissions = Permission.objects.filter(codename__in=[
        'view_resource',
        'add_resource',
        'change_resource',
        'restore_resource',
        'trash_resource',
    ])
    for permission in new_pmem_permissions:
        assignment = RolePermissionAssignment.objects.filter(role=pmem_role, permission=permission)
        if not assignment.exists():
            RolePermissionAssignment.objects.create(role=pmem_role, permission=permission)


class Migration(migrations.Migration):
    dependencies = [
        ('integration', '0001_update_groups_and_roles'),
    ]

    operations = [
        RunPython(
            update_transaction,
            RunPython.noop  # no undo possible
        )
    ]
