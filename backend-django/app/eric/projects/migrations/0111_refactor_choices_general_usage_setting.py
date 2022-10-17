# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models

from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


def refactor_general_usage_settings(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    Resource = apps.get_model("projects", "Resource")
    with disable_permission_checks(Resource):
        for item in Resource.objects.using(db_alias).all():
            if item.general_usage_setting != 'GLB':
                if item.usage_setting_selected_user_groups.exists():
                    item.general_usage_setting = 'GRP'
                else:
                    item.general_usage_setting = 'NST'
                item.save()
    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0110_resource_general_usage_setting'),
    ]

    operations = [
        migrations.AlterField(
            model_name='resource',
            name='general_usage_setting',
            field=models.CharField(choices=[('GLB', 'Global'), ('GRP', 'Only selected user groups'), ('NST', 'Not set')], db_index=True, default='NST', max_length=3, verbose_name='General usage setting for this resource'),
        ),
        migrations.RunPython(refactor_general_usage_settings, migrations.RunPython.noop),
    ]
