#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.core.management.sql import emit_post_migrate_signal
from django.db import migrations


class PermissionContentTypeApplyMigration(migrations.Migration):
    def apply(self, project_state, schema_editor, collect_sql=False):
        # we need current content types and migrations
        # therefore we need to emit a post migrate signal BEFORE we access those
        # https://code.djangoproject.com/ticket/23422
        db_alias = schema_editor.connection.alias
        emit_post_migrate_signal(2, False, db_alias)

        return super().apply(project_state, schema_editor, collect_sql)

    def unapply(self, project_state, schema_editor, collect_sql=False):
        ret = super().unapply(project_state, schema_editor, collect_sql)
        # we need current content types and migrations
        # therefore we need to emit a post migrate signal BEFORE we access those
        # https://code.djangoproject.com/ticket/23422
        db_alias = schema_editor.connection.alias

        emit_post_migrate_signal(2, False, db_alias)
        return ret


class PermissionMigrationHelper:
    @staticmethod
    def convert_string_permissions_list_to_model_permissions(apps, schema_editor, string_permission_list):
        """Converts a given string permission list to a set of Django permissions"""
        ContentType = apps.get_model("contenttypes", "ContentType")
        Permission = apps.get_model("auth", "Permission")

        db_alias = schema_editor.connection.alias

        model_permissions = []

        for string_permission in string_permission_list:
            # string permission looks as follows:
            # ['codename', 'app', 'Model']
            assert (
                len(string_permission) == 3
            ), "Parameter string_permission_list is an array and must contain arrays of exactly 3 elements"

            # get content type of the model
            if isinstance(string_permission[1], list):
                content_type = (
                    ContentType.objects.using(db_alias)
                    .filter(app_label__in=string_permission[1], model=string_permission[2])
                    .first()
                )
            else:
                content_type = ContentType.objects.using(db_alias).get(
                    app_label=string_permission[1], model=string_permission[2]
                )

            # get the permission via code name and content type
            permissions = Permission.objects.using(db_alias).filter(
                codename=string_permission[0], content_type=content_type
            )
            assert (
                len(permissions) <= 1
            ), "There are %(number_permission)d (expected 1) permissions with the name %(permission_name)s" % {
                "number_permission": len(permissions),
                "permission_name": string_permission[0],
            }

            if len(permissions) == 1:
                # get the first (and only permission)
                permission = permissions.first()
                # and append it to the model permissions list
                model_permissions.append(permission)
            else:
                print("Warning: Permission %(permission_name)s not found", string_permission[0])

        return model_permissions

    @staticmethod
    def add_permissions_to_role(apps, schema_editor, permissions, role):
        """adds a list of django permissions to a role"""
        RolePermissionAssignment = apps.get_model("projects", "RolePermissionAssignment")
        db_alias = schema_editor.connection.alias

        # collect role permission assignments
        role_permission_assignments = []

        for permission in permissions:
            if not RolePermissionAssignment.objects.using(db_alias).filter(role=role, permission=permission).exists():
                role_permission_assignments.append(RolePermissionAssignment(role=role, permission=permission))

        # bulk create role permission assignments
        RolePermissionAssignment.objects.using(db_alias).bulk_create(role_permission_assignments)

    @staticmethod
    def remove_permission_from_role(apps, schema_editor, permissions, role):
        """removes a list of django permissions from a role"""
        RolePermissionAssignment = apps.get_model("projects", "RolePermissionAssignment")
        db_alias = schema_editor.connection.alias

        for permission in permissions:
            RolePermissionAssignment.objects.using(db_alias).filter(role=role, permission=permission).delete()

    @staticmethod
    def forwards_func_project_manager(permissions_to_add, apps, schema_editor):
        """Migration forward func for adding permissions to the project manager"""
        Role = apps.get_model("projects", "Role")

        db_alias = schema_editor.connection.alias

        permissions = PermissionMigrationHelper.convert_string_permissions_list_to_model_permissions(
            apps, schema_editor, permissions_to_add
        )

        project_manager_role = Role.objects.using(db_alias).filter(default_role_on_project_create=True).first()

        PermissionMigrationHelper.add_permissions_to_role(apps, schema_editor, permissions, project_manager_role)

    @staticmethod
    def reverse_func_project_manager(permissions_to_add, apps, schema_editor):
        """Migration reverse func for removing permissions to the project manager"""
        Role = apps.get_model("projects", "Role")

        db_alias = schema_editor.connection.alias

        permissions = PermissionMigrationHelper.convert_string_permissions_list_to_model_permissions(
            apps, schema_editor, permissions_to_add
        )

        project_manager_role = Role.objects.using(db_alias).filter(default_role_on_project_create=True).first()

        PermissionMigrationHelper.remove_permission_from_role(apps, schema_editor, permissions, project_manager_role)

    @staticmethod
    def forwards_func_observer(permissions_to_add, apps, schema_editor):
        """Migration forward func for adding permissions to the project manager"""
        Role = apps.get_model("projects", "Role")

        db_alias = schema_editor.connection.alias

        permissions = PermissionMigrationHelper.convert_string_permissions_list_to_model_permissions(
            apps, schema_editor, permissions_to_add
        )

        observer_role = Role.objects.using(db_alias).filter(name="Observer").first()

        PermissionMigrationHelper.add_permissions_to_role(apps, schema_editor, permissions, observer_role)

    @staticmethod
    def reverse_func_observer(permissions_to_add, apps, schema_editor):
        """Migration reverse func for removing permissions to the project manager"""
        Role = apps.get_model("projects", "Role")

        db_alias = schema_editor.connection.alias

        permissions = PermissionMigrationHelper.convert_string_permissions_list_to_model_permissions(
            apps, schema_editor, permissions_to_add
        )

        observer_role = Role.objects.using(db_alias).filter(name="Observer").first()

        PermissionMigrationHelper.remove_permission_from_role(apps, schema_editor, permissions, observer_role)


class ContentTypeMigrationHelper:
    @staticmethod
    def rename_content_type(apps, schema_editor, model_name, old_app_label, new_app_label):
        db_alias = schema_editor.connection.alias

        # We get the model from the versioned app registry;
        # if we directly import it, it'll be the wrong version
        ContentType = apps.get_model("contenttypes", "ContentType")

        qs = ContentType.objects.using(db_alias).filter(app_label=old_app_label, model__iexact=model_name)

        if qs.exists():
            ct = qs.first()
            ct.app_label = new_app_label
            ct.save()

    @staticmethod
    def reverse_rename_content_type(apps, schema_editor, model_name, old_app_label, new_app_label):
        db_alias = schema_editor.connection.alias

        # We get the model from the versioned app registry;
        # if we directly import it, it'll be the wrong version
        ContentType = apps.get_model("contenttypes", "ContentType")

        qs = ContentType.objects.using(db_alias).filter(app_label=new_app_label, model__iexact=model_name)

        if qs.exists():
            ct = qs.first()
            ct.app_label = old_app_label
            ct.save()
