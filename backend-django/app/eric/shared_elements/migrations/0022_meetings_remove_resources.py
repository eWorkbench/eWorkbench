# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations
from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


def set_meeting_resource_null(apps, schema_editor):
    """
    Sets all resources in meetings to null to avoid problems with booking rule validation
    :param apps:
    :param schema_editor:
    :return:
    """
    RevisionModelMixin.set_enabled(False)

    Meeting = apps.get_model('shared_elements', 'Meeting')

    with disable_permission_checks(Meeting):
        Meeting.objects.update(resource=None)

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0021_task_checklist_order_by_created_at'),
    ]

    operations = [
        migrations.RunPython(set_meeting_resource_null, migrations.RunPython.noop),
    ]
