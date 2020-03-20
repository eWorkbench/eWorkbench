# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations
import uuid

def gen_uuid(apps, schema_editor):
    Resource = apps.get_model('projects', 'Resource')
    for row in Resource.objects.all():
        row.inventory_number = uuid.uuid4()
        row.save(update_fields=['inventory_number'])

def rename_devices(apps, schema_editor):
    Resource = apps.get_model('projects', 'Resource')
    for row in Resource.objects.all():
        if row.type == "Device":
            row.type = "LABEQ"
            row.save(update_fields=['type'])
        if row.type == "Room":
            row.type = "ROOM"
            row.save(update_fields=['type'])


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0084_resources_refactor'),
    ]

    operations = [
        migrations.RunPython(gen_uuid, reverse_code=migrations.RunPython.noop),
        migrations.RunPython(rename_devices, reverse_code=migrations.RunPython.noop),
    ]
