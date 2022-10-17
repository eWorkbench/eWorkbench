#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import json

from django.db import migrations, transaction
from django.db.migrations import RunPython


@transaction.atomic
def update_groups_and_roles(apps, schema_editor):
    update_groups(apps)
    update_roles(apps)


def update_groups(apps):
    groups_fixture = load_groups_fixture()

    for fixture_group in groups_fixture:
        update_group(apps, fixture_group)

    # Groups that are not defined in the fixture could be easily removed here.
    # But since that is a very destructive action that can't be undone, we do not do that.


def update_group(apps, fixture_group):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    db_group, created = Group.objects.get_or_create(name=fixture_group['name'])

    permission_list = Permission.objects.filter(codename__in=fixture_group['permissions'])
    db_group.permissions.set(permission_list)


def update_roles(apps):
    Role = apps.get_model('projects', 'Role')
    RolePermissionAssignment = apps.get_model('projects', 'RolePermissionAssignment')

    roles_fixture = load_roles_fixture()

    # rename old Student role to Project Member
    Role.objects.filter(name='Student').update(name='Project Member')

    # remove old role permission assignments
    RolePermissionAssignment.objects.all().delete()

    for fixture_role in roles_fixture:
        update_role(apps, fixture_role)

    # Roles that are not defined in the fixture could be easily removed here.
    # But since that is a very destructive action that can't be undone,
    # and potentially users could be removed from projects, we do not do that.


def update_role(apps, fixture_role):
    Role = apps.get_model('projects', 'Role')
    RolePermissionAssignment = apps.get_model('projects', 'RolePermissionAssignment')
    Permission = apps.get_model('auth', 'Permission')

    db_role, created = Role.objects.get_or_create(name=fixture_role['name'])

    # bulk create role-permission assignments
    permission_list = Permission.objects.filter(codename__in=fixture_role['permissions'])
    assignments = [
        RolePermissionAssignment(role=db_role, permission=permission)
        for permission in permission_list
    ]
    RolePermissionAssignment.objects.bulk_create(assignments)

    # update default flags
    db_role.default_role_on_project_create = fixture_role['default_project_create']
    db_role.default_role_on_project_user_assign = fixture_role['default_user_assign']
    db_role.save()


def load_groups_fixture():
    return json.loads('''[
        {
          "name": "DMP Admin",
          "permissions": [
            "add_dmpform",
            "change_dmpform",
            "delete_dmpform",
            "add_dmpformfield",
            "change_dmpformfield",
            "delete_dmpformfield"
          ]
        },
        {
          "name": "Text Template Admin",
          "permissions": [
            "add_texttemplate",
            "change_texttemplate",
            "delete_texttemplate",
            "view_texttemplate"
          ]
        },
        {
          "name": "External",
          "permissions": [
            "view_metadata",
            "add_note_without_project"
          ]
        },
        {
          "name": "Resource Admin",
          "permissions": [
            "add_resource",
            "change_resource",
            "delete_resource",
            "view_resource"
          ]
        },
        {
          "name": "User Manual Admin",
          "permissions": [
            "add_usermanualcategory",
            "change_usermanualcategory",
            "delete_usermanualcategory",
            "add_usermanualhelptext",
            "change_usermanualhelptext",
            "delete_usermanualhelptext",
            "add_usermanualplaceholder",
            "change_usermanualplaceholder",
            "delete_usermanualplaceholder"
          ]
        },
        {
          "name": "Metadata Admin",
          "permissions": [
            "add_metadata",
            "change_metadata",
            "delete_metadata",
            "view_metadata",
            "add_metadatafield",
            "change_metadatafield",
            "delete_metadatafield"
          ]
        },
        {
          "name": "Metadata User",
          "permissions": [
            "view_metadata"
          ]
        },
        {
          "name": "Student",
          "permissions": [
            "add_dmp_without_project",
            "add_drive_without_project",
            "add_kanbanboard_without_project",
            "add_labbook_without_project",
            "add_labbooksection",
            "add_labbooksection_without_project",
            "view_metadata",
            "add_picture_without_project",
            "add_project",
            "invite_external_user",
            "add_resource_without_project",
            "add_contact_without_project",
            "add_file_without_project",
            "add_meeting_without_project",
            "add_note_without_project",
            "add_task_without_project"
          ]
        },
        {
          "name": "User",
          "permissions": [
            "add_dmp_without_project",
            "add_drive_without_project",
            "add_kanbanboard_without_project",
            "add_labbook_without_project",
            "add_labbooksection",
            "add_labbooksection_without_project",
            "view_metadata",
            "add_picture_without_project",
            "add_project",
            "invite_external_user",
            "add_resource_without_project",
            "add_contact_without_project",
            "add_file_without_project",
            "add_meeting_without_project",
            "add_note_without_project",
            "add_task_without_project"
          ]
        }
        ]''')


def load_roles_fixture():
    return json.loads('''[
        {
          "default_project_create": true,
          "default_user_assign": false,
          "name": "Project Manager",
          "permissions": [
            "add_dmp",
            "change_dmp",
            "delete_dmp",
            "restore_dmp",
            "trash_dmp",
            "view_dmp",
            "change_dmpformdata",
            "add_drive",
            "change_drive",
            "change_project_drive",
            "delete_drive",
            "restore_drive",
            "trash_drive",
            "view_drive",
            "add_kanbanboard",
            "change_kanbanboard",
            "change_project_kanbanboard",
            "delete_kanbanboard",
            "restore_kanbanboard",
            "trash_kanbanboard",
            "view_kanbanboard",
            "add_labbook",
            "change_labbook",
            "change_project_labbook",
            "delete_labbook",
            "restore_labbook",
            "trash_labbook",
            "view_labbook",
            "add_labbooksection",
            "add_picture",
            "change_picture",
            "change_project_picture",
            "delete_picture",
            "restore_picture",
            "trash_picture",
            "view_picture",
            "add_project",
            "change_parent_project",
            "change_project",
            "delete_project",
            "restore_project",
            "trash_project",
            "view_project",
            "add_projectroleuserassignment",
            "change_projectroleuserassignment",
            "delete_projectroleuserassignment",
            "view_projectroleuserassignment",
            "add_resource",
            "change_resource",
            "delete_resource",
            "add_contact",
            "change_contact",
            "change_project_contact",
            "delete_contact",
            "restore_contact",
            "trash_contact",
            "view_contact",
            "add_contactattendsmeeting",
            "change_contactattendsmeeting",
            "delete_contactattendsmeeting",
            "view_contactattendsmeeting",
            "add_file",
            "change_file",
            "change_project_file",
            "delete_file",
            "restore_file",
            "trash_file",
            "view_file",
            "add_meeting",
            "change_meeting",
            "change_project_meeting",
            "delete_meeting",
            "restore_meeting",
            "trash_meeting",
            "view_meeting",
            "add_note",
            "change_note",
            "change_project_note",
            "delete_note",
            "restore_note",
            "trash_note",
            "view_note",
            "add_task",
            "change_project_task",
            "change_task",
            "delete_task",
            "restore_task",
            "trash_task",
            "view_task",
            "add_userattendsmeeting",
            "change_userattendsmeeting",
            "delete_userattendsmeeting",
            "view_userattendsmeeting"
          ]
        },
        {
          "default_project_create": false,
          "default_user_assign": true,
          "name": "No Access",
          "permissions": []
        },
        {
          "default_project_create": false,
          "default_user_assign": false,
          "name": "Observer",
          "permissions": [
            "view_dmp",
            "view_dmp_form_data",
            "view_drive",
            "view_kanbanboard",
            "view_labbook",
            "view_picture",
            "view_project",
            "view_projectroleuserassignment",
            "view_resource",
            "view_contact",
            "view_contactattendsmeeting",
            "view_file",
            "view_meeting",
            "add_note",
            "view_note",
            "view_task",
            "view_userattendsmeeting"
          ]
        },
        {
          "default_project_create": false,
          "default_user_assign": false,
          "name": "Project Member",
          "permissions": [
            "view_dmp",
            "add_drive",
            "change_drive",
            "trash_drive",
            "view_drive",
            "add_kanbanboard",
            "change_kanbanboard",
            "restore_kanbanboard",
            "trash_kanbanboard",
            "view_kanbanboard",
            "add_labbook",
            "change_labbook",
            "trash_labbook",
            "view_labbook",
            "add_labbooksection",
            "add_picture",
            "change_picture",
            "restore_picture",
            "trash_picture",
            "view_picture",
            "view_project",
            "view_projectroleuserassignment",
            "add_relation",
            "change_relation",
            "add_contact",
            "change_contact",
            "trash_contact",
            "view_contact",
            "add_contactattendsmeeting",
            "change_contactattendsmeeting",
            "delete_contactattendsmeeting",
            "view_contactattendsmeeting",
            "add_file",
            "change_file",
            "trash_file",
            "view_file",
            "add_meeting",
            "change_meeting",
            "trash_meeting",
            "view_meeting",
            "add_note",
            "change_note",
            "trash_note",
            "view_note",
            "add_task",
            "change_task",
            "trash_task",
            "view_task",
            "add_userattendsmeeting",
            "change_userattendsmeeting",
            "delete_userattendsmeeting",
            "view_userattendsmeeting"
          ]
        }
      ]''')


class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0097_booking_integration_in_appointments'),
    ]

    operations = [
        RunPython(
            update_groups_and_roles,
            RunPython.noop  # no undo possible
        )
    ]
