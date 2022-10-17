# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.db.models.deletion
from django.conf import settings
from django.db import migrations

import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ('caldav', '0002_add_created_by_at_last_modified_by_at_mixin'),
    ]

    operations = [
        migrations.AlterField(
            model_name='caldavitem',
            name='deleted_via_caldav_by',
            field=django_userforeignkey.models.fields.UserForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='The user that deleted the item via CalDav'),
        ),
    ]
