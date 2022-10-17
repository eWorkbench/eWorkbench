# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import hashlib

from django.db import migrations, models
from django.db.migrations import RunPython


def compute_hash(log):
    hash_object = hashlib.sha1()
    hash_object.update(log.message.encode('utf-8'))
    if log.trace:
        hash_object.update(log.trace.encode('utf-8'))

    return hash_object.hexdigest()


def compute_hashes(apps, schema_editor):
    DBLog = apps.get_model("db_logging", "DBLog")

    for log in DBLog.objects.all():
        log.hash = compute_hash(log)
        log.save()


class Migration(migrations.Migration):
    dependencies = [
        ('db_logging', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dblog',
            name='hash',
            field=models.CharField(blank=True, max_length=160, null=True),
        ),
        migrations.RunPython(compute_hashes, RunPython.noop)
    ]
