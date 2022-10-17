# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from datetime import time

from django.db import migrations

from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


def set_full_day_according_to_times(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    ResourceBookingRuleBookableHours = apps.get_model("projects", "ResourceBookingRuleBookableHours")

    with disable_permission_checks(ResourceBookingRuleBookableHours):
        zero_time = time(0, 0, 0)
        # first get all entries that are not full days
        all_non_full_day_entries = ResourceBookingRuleBookableHours.objects.using(db_alias).exclude(
            time_start=zero_time,
            time_end=zero_time,
        )
        all_non_full_day_entries.update(
            full_day=False
        )

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0103_resourcebookingrulebookablehours_full_day'),
    ]

    operations = [
        migrations.RunPython(set_full_day_according_to_times, migrations.RunPython.noop),
    ]
