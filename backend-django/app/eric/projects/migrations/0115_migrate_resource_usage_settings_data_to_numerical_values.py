# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations

from django_changeset.models import RevisionModelMixin

from eric.core.models import DisableSignals
from eric.projects.models.models import Resource

OLD_SELECTED_GROUPS = "GRP"
OLD_GLOBAL = "GLB"


def migrate_resource_usage_settings_fields_forward(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias
    # Resource = apps.get_model('shared_elements', 'Resource')

    with DisableSignals():  # avoid permission/lock checks
        Resource.objects.using(db_alias).filter(general_usage_setting=OLD_SELECTED_GROUPS).update(
            general_usage_setting = Resource.SELECTED_GROUPS)

        Resource.objects.using(db_alias).filter(general_usage_setting=OLD_GLOBAL).update(
            general_usage_setting = Resource.GLOBAL)

    RevisionModelMixin.set_enabled(True)


def migrate_resource_usage_settings_fields_backward(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias
    # Resource = apps.get_model('shared_elements', 'Resource')

    with DisableSignals():  # avoid permission/lock checks
        Resource.objects.using(db_alias).filter(general_usage_setting=Resource.SELECTED_GROUPS).update(
            general_usage_setting = OLD_SELECTED_GROUPS)

        Resource.objects.using(db_alias).filter(general_usage_setting=Resource.GLOBAL).update(
            general_usage_setting = OLD_GLOBAL)

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0114_migrate_resource_usage_settings_fields_to_numerical_values'),
    ]

    operations = [
        migrations.RunPython(
            migrate_resource_usage_settings_fields_forward,
            migrate_resource_usage_settings_fields_backward
        ),
    ]
