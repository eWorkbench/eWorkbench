# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations

from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


def create_footer_pages(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    Content = apps.get_model("cms", "Content")

    with disable_permission_checks(Content):
        # first check if an entry exists
        imprint_page = Content.objects.using(db_alias).filter(
            slug="imprint"
        ).first()
        # if no entry exists, we create an "empty" one
        if not imprint_page:
            Content.objects.using(db_alias).create(
                slug="imprint",
                title="Imprint"
            )

        # first check if an entry exists
        privacy_page = Content.objects.using(db_alias).filter(
            slug="privacy"
        ).first()
        # if no entry exists, we create an "empty" one
        if not privacy_page:
            Content.objects.using(db_alias).create(
                slug="privacy",
                title="Privacy"
            )

        # first check if an entry exists
        accessibility_page = Content.objects.using(db_alias).filter(
            slug="accessibility"
        ).first()
        # if no entry exists, we create an "empty" one
        if not accessibility_page:
            Content.objects.using(db_alias).create(
                slug="accessibility",
                title="Accessibility"
            )

        # first check if an entry exists
        frontend_licenses_page = Content.objects.using(db_alias).filter(
            slug="frontend_licenses"
        ).first()
        # if no entry exists, we create an "empty" one
        if not frontend_licenses_page:
            Content.objects.using(db_alias).create(
                slug="frontend_licenses",
                title="Frontend Licenses"
            )
    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0002_create_maintenance_text'),
    ]

    operations = [
        migrations.RunPython(create_footer_pages, migrations.RunPython.noop),
    ]
