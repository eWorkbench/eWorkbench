# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


def rename_content_type(apps, schema_editor):
    db_alias = schema_editor.connection.alias

    # We get the model from the versioned app registry;
    # if we directly import it, it'll be the wrong version
    ContentType = apps.get_model("contenttypes", "ContentType")

    qs = ContentType.objects.using(db_alias).filter(app_label='projects', model='userprofile')

    if qs.exists():
        ct = qs.first()
        ct.app_label = 'userprofile'
        ct.save()


def reverse_rename_content_type(apps, schema_editor):
    db_alias = schema_editor.connection.alias

    # We get the model from the versioned app registry;
    # if we directly import it, it'll be the wrong version
    ContentType = apps.get_model("contenttypes", "ContentType")

    qs = ContentType.objects.using(db_alias).filter(app_label='userprofile', model='userprofile')

    if qs.exists():
        ct = qs.first()
        ct.app_label = 'projects'
        ct.save()


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0072_version_fields'),
    ]

    database_operations = [
        migrations.AlterModelTable('UserProfile', 'userprofile_userprofile')
    ]

    state_operations = [
        migrations.DeleteModel('UserProfile')
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=database_operations,
            state_operations=state_operations),
        migrations.RunPython(rename_content_type, reverse_rename_content_type),
    ]
