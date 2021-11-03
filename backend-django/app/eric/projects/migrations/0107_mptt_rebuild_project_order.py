#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, transaction

from eric.core.models import disable_permission_checks


def rebuild_projects_tree(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    with disable_permission_checks(Project), transaction.atomic():
        from eric.projects.models.models import Project
        Project.objects.rebuild()


class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0106_add_mptt'),
    ]

    operations = [
        migrations.RunPython(
            rebuild_projects_tree,
            migrations.RunPython.noop
        ),
    ]
