#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.core.management.sql import emit_post_migrate_signal
from django.db import migrations, transaction
from django.db.migrations import RunPython


@transaction.atomic
def update_role(apps, schema_editor):
    wanted_permissions = [
        "add_contact",
        "add_contactattendsmeeting",
        "add_dmp",
        "add_drive",
        "add_file",
        "add_kanbanboard",
        "add_labbook",
        "add_labbooksection",
        "add_meeting",
        "add_note",
        "add_picture",
        "add_plugininstance",
        "add_relation",
        "add_resource",
        "add_task",
        "add_userattendsmeeting",
        "change_contact",
        "change_contactattendsmeeting",
        "change_dmp",
        "change_dmpformdata",
        "change_drive",
        "change_file",
        "change_kanbanboard",
        "change_labbook",
        "change_meeting",
        "change_note",
        "change_picture",
        "change_plugininstance",
        "change_relation",
        "change_resource",
        "change_task",
        "change_userattendsmeeting",
        "delete_contactattendsmeeting",
        "delete_userattendsmeeting",
        "restore_contact",
        "restore_dmp",
        "restore_drive",
        "restore_file",
        "restore_kanbanboard",
        "restore_labbook",
        "restore_meeting",
        "restore_note",
        "restore_picture",
        "restore_plugininstance",
        "restore_resource",
        "restore_task",
        "trash_contact",
        "trash_dmp",
        "trash_drive",
        "trash_file",
        "trash_kanbanboard",
        "trash_labbook",
        "trash_meeting",
        "trash_note",
        "trash_picture",
        "trash_plugininstance",
        "trash_resource",
        "trash_task",
        "view_contact",
        "view_contactattendsmeeting",
        "view_dmp",
        "view_drive",
        "view_file",
        "view_kanbanboard",
        "view_labbook",
        "view_meeting",
        "view_note",
        "view_picture",
        "view_plugininstance",
        "view_project",
        "view_projectroleuserassignment",
        "view_resource",
        "view_task",
        "view_userattendsmeeting",
    ]

    role_name = 'Project Member'

    wipe_permissions_of_role(apps, role_name)

    add_permissions_to_role(apps, role_name, wanted_permissions)


def wipe_permissions_of_role(apps, role_name):
    Role = apps.get_model('projects', 'Role')
    RolePermissionAssignment = apps.get_model('projects', 'RolePermissionAssignment')

    role = Role.objects.filter(name=role_name).first()
    RolePermissionAssignment.objects.filter(role=role).delete()


def add_permissions_to_role(apps, role_name, permission_codenames):
    Role = apps.get_model('projects', 'Role')
    Permission = apps.get_model('auth', 'Permission')
    RolePermissionAssignment = apps.get_model('projects', 'RolePermissionAssignment')

    role = Role.objects.filter(name=role_name).first()
    for codename in permission_codenames:
        perm = Permission.objects.get(codename=codename)
        RolePermissionAssignment.objects.get_or_create(role=role, permission_id=perm.id)


class Migration(migrations.Migration):
    dependencies = [
        ('integration', '0004_update_roles_for_plugininstances'),
    ]

    operations = [
        RunPython(
            update_role,
            RunPython.noop  # no undo possible
        )
    ]
