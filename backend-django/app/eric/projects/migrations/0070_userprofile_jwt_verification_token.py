# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals
import uuid
from django.db import migrations, models


def gen_uuid(apps, schema_editor):
    """
    Generates jwt_verification_tokens for all existing users
    :param apps:
    :param schema_editor:
    :return:
    """
    UserProfile = apps.get_model('projects', 'UserProfile')

    for row in UserProfile.objects.all():
        row.jwt_verification_token = uuid.uuid4().hex
        row.save(update_fields=['jwt_verification_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0069_pm_add_trash_restore_permission'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='jwt_verification_token',
            field=models.CharField(default='', max_length=128, verbose_name='Verification Token for JWT'),
        ),
        migrations.RunPython(gen_uuid, reverse_code=migrations.RunPython.noop),
    ]
