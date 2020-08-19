# -*- coding: utf-8 -*-
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
        'view_plugininstance',
        'add_plugininstance',
        'change_plugininstance',
        'restore_plugininstance',
        'trash_plugininstance',
        'delete_plugininstance',
        'change_project_plugininstance',
    ])

    add_permissions_to_role(apps, 'Project Member', [
        'view_plugininstance',
        'add_plugininstance',
        'change_plugininstance',
        'restore_plugininstance',
        'trash_plugininstance',
    ])

    add_permissions_to_role(apps, 'Observer', [
        'view_plugininstance',
    ])

    # update user groups
    add_permissions_to_group(apps, 'Student', [
        'add_plugininstance_without_project',
    ])

    add_permissions_to_group(apps, 'User', [
        'add_plugininstance_without_project',
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
        ('plugins', '0001_initial'),
        ('integration', '0003_remove_text_template_admin'),
    ]

    operations = [
        RunPython(
            update_roles_and_groups,
            RunPython.noop  # no undo possible
        )
    ]
