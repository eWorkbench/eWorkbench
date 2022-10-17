# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models

from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


def refactor_general_usage_setting(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    Resource = apps.get_model("projects", "Resource")
    with disable_permission_checks(Resource):
        for item in Resource.objects.using(db_alias).all():
            if item.general_usage_setting == 'NST':
                item.general_usage_setting = None
                item.save()
    RevisionModelMixin.set_enabled(True)


def reverse_refactor_general_usage_setting(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    Resource = apps.get_model("projects", "Resource")
    with disable_permission_checks(Resource):
        for item in Resource.objects.using(db_alias).all():
            if not item.general_usage_setting:
                item.general_usage_setting = 'NST'
                item.save()
    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0112_merge_20220325_0922'),
    ]

    operations = [
        migrations.AlterField(
            model_name='resource',
            name='general_usage_setting',
            field=models.CharField(blank=True,
                                   choices=[('GLB', 'Global'), ('GRP', 'Only selected user groups')],
                                   default=None, max_length=3, null=True,
                                   verbose_name='General usage setting for this resource'),
        ),
        migrations.RunPython(refactor_general_usage_setting, reverse_refactor_general_usage_setting),
    ]
