#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.core.management.sql import emit_post_migrate_signal
from django.db import migrations, transaction
from django.db.migrations import RunPython


@transaction.atomic
def update_roles_and_groups(apps, schema_editor):
    # trigger post-migrate handlers to ensure new permissions are available
    emit_post_migrate_signal(verbosity=2, interactive=False, db='default')

    # update project roles
    add_permissions_to_role(apps, 'Project Manager', [
        'view_comment',
        'add_comment',
        'change_comment',
        'restore_comment',
        'trash_comment',
        'delete_comment',
        'change_project_comment',
    ])

    add_permissions_to_role(apps, 'Project Member', [
        'view_comment',
        'add_comment',
        'change_comment',
        'restore_comment',
        'trash_comment',
    ])

    add_permissions_to_role(apps, 'Observer', [
        'view_comment',
    ])

    # update user groups
    add_permissions_to_group(apps, 'Student', [
        'add_comment_without_project',
    ])

    add_permissions_to_group(apps, 'User', [
        'add_comment_without_project',
    ])

    add_permissions_to_group(apps, 'External', [
        'add_comment_without_project',
    ])


def add_permissions_to_role(apps, role_name, permission_codenames):
    Role = apps.get_model('projects', 'Role')
    Permission = apps.get_model('auth', 'Permission')
    RolePermissionAssignment = apps.get_model('projects', 'RolePermissionAssignment')

    role = Role.objects.filter(name=role_name).first()
    for codename in permission_codenames:
        perm = Permission.objects.get(codename=codename)
        RolePermissionAssignment.objects.get_or_create(role=role, permission_id=perm.id)


def add_permissions_to_group(apps, group_name, permission_codenames):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    group = Group.objects.filter(name=group_name).first()
    if group:
        for codename in permission_codenames:
            perm = Permission.objects.get(codename=codename)
            group.permissions.add(perm)


class Migration(migrations.Migration):
    dependencies = [
        ('shared_elements', '0035_comment'),
        ('integration', '0005_update_roles_for_inconsistent_project_entities'),
    ]

    operations = [
        RunPython(
            update_roles_and_groups,
            RunPython.noop  # no undo possible
        )
    ]
