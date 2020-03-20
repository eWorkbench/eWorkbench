# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks

PRIVILEGE_CHOICES_ALLOW = "AL"


def convert_from_truefalse_to_allowdenyneutral(apps, schema_editor):
    """
    Converts ModelPrivilege
    if can_view/can_edit/can_delete/can_restore is True, then we set the new "choices" can_view/... to "AL" (allow)
    :param apps:
    :param schema_editor:
    :return:
    """
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    ModelPrivilege = apps.get_model('model_privileges', 'ModelPrivilege')

    with disable_permission_checks(ModelPrivilege):
        # iterate over all model privileges and fill the new allow/deny/neutral privileges
        for model_privilege in ModelPrivilege.objects.using(db_alias).all():
            if model_privilege.is_owner:
                model_privilege.full_access_privilege = PRIVILEGE_CHOICES_ALLOW
            if model_privilege.can_view:
                model_privilege.view_privilege = PRIVILEGE_CHOICES_ALLOW
            if model_privilege.can_edit:
                model_privilege.edit_privilege = PRIVILEGE_CHOICES_ALLOW
            if model_privilege.can_delete:
                model_privilege.delete_privilege = PRIVILEGE_CHOICES_ALLOW
            if model_privilege.can_restore:
                model_privilege.restore_privilege = PRIVILEGE_CHOICES_ALLOW

            model_privilege.save()

    RevisionModelMixin.set_enabled(True)


def convert_from_allowdenyneutral_to_truefalse(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    ModelPrivilege = apps.get_model('model_privileges', 'ModelPrivilege')

    with disable_permission_checks(ModelPrivilege):
        # iterate over all model privileges and fill the new allow/deny/neutral privileges
        for model_privilege in ModelPrivilege.objects.using(db_alias).all():
            if model_privilege.view_privilege == PRIVILEGE_CHOICES_ALLOW:
                model_privilege.can_view = True
            if model_privilege.edit_privilege == PRIVILEGE_CHOICES_ALLOW:
                model_privilege.can_edit = True
            if model_privilege.delete_privilege == PRIVILEGE_CHOICES_ALLOW:
                model_privilege.can_delete = True
            if model_privilege.restore_privilege == PRIVILEGE_CHOICES_ALLOW:
                model_privilege.can_restore = True

            model_privilege.save()

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('model_privileges', '0002_model_privilege_allow_deny_neutral'),
    ]

    operations = [
        migrations.RunPython(convert_from_truefalse_to_allowdenyneutral, convert_from_allowdenyneutral_to_truefalse),
    ]
