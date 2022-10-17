# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations

from django_changeset.models import RevisionModelMixin

from eric.core.models import disable_permission_checks
from eric.model_privileges.models import ModelPrivilege


def fix_privileges(privilege):
    if privilege.full_access_privilege == ModelPrivilege.ALLOW:
        return

    # Check if the privileges are correct and fix them if they are not. We start checking them from the
    # right side and fix privilege based on the "highest" allowed privilege in the following order:
    # restore > trash > edit > view
    if privilege.restore_privilege == ModelPrivilege.ALLOW:
        privilege.view_privilege = ModelPrivilege.ALLOW
        privilege.edit_privilege = ModelPrivilege.ALLOW
        privilege.trash_privilege = ModelPrivilege.ALLOW
    elif privilege.trash_privilege == ModelPrivilege.ALLOW:
        privilege.view_privilege = ModelPrivilege.ALLOW
        privilege.edit_privilege = ModelPrivilege.ALLOW
    elif privilege.edit_privilege == ModelPrivilege.ALLOW:
        privilege.view_privilege = ModelPrivilege.ALLOW

    # Now, we must also check the denied privileges. We start checking them from the left side and fix
    # privilege based on the "lowest" denied privilege in the following order:
    # view > edit > trash > restore
    if privilege.view_privilege == ModelPrivilege.DENY:
        privilege.edit_privilege = ModelPrivilege.DENY
        privilege.trash_privilege = ModelPrivilege.DENY
        privilege.restore_privilege = ModelPrivilege.DENY
    elif privilege.edit_privilege == ModelPrivilege.DENY:
        privilege.trash_privilege = ModelPrivilege.DENY
        privilege.restore_privilege = ModelPrivilege.DENY
    elif privilege.trash_privilege == ModelPrivilege.DENY:
        privilege.restore_privilege = ModelPrivilege.DENY

    privilege.save()


def fix_privileges_up(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    with disable_permission_checks(ModelPrivilege):
        privileges = ModelPrivilege.objects.all()
        for privilege in privileges:
            fix_privileges(privilege)

    RevisionModelMixin.set_enabled(True)


def fix_privileges_down(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('model_privileges', '0007_model_privileges_unique'),
    ]

    operations = [
        migrations.RunPython(fix_privileges_up, fix_privileges_down),
    ]
