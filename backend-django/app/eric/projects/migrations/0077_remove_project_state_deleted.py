# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations

from django_changeset.models import RevisionModelMixin

CANCEL = 'CANCE'
DELETED = 'DEL'


def change_project_state_from_deleted_to_cancel(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    Project = apps.get_model('projects', 'Project')

    Project.objects.filter(project_state=DELETED).update(project_state=CANCEL, deleted=True)

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0076_userstoragelimit'),
    ]

    operations = [
        migrations.RunPython(
            change_project_state_from_deleted_to_cancel, None
        ),
    ]
