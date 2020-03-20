# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations
from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


def create_maintenance_text(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    Content = apps.get_model("cms", "Content")

    with disable_permission_checks(Content):
        # first check if an entry exists
        maintenance_text = Content.objects.using(db_alias).filter(
            slug="maintenance"
        ).first()

        # if no entry exists, we create an "empty" one
        if not maintenance_text:
            Content.objects.using(db_alias).create(
                slug="maintenance",
                title="Maintenance"
            )
    RevisionModelMixin.set_enabled(True)


def remove_maintenance_text(apps, schema_editor):
    db_alias = schema_editor.connection.alias
    Content = apps.get_model("cms", "Content")

    with disable_permission_checks(Content):
        # first check if an entry exists
        maintenance_text = Content.objects.using(db_alias).filter(
            slug="maintenance"
        ).first()

        # if an entry exists, we delete it
        if maintenance_text:
            maintenance_text.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_maintenance_text, remove_maintenance_text),
    ]
