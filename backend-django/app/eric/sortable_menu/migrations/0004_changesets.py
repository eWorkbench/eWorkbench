# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations
import django.db.models.deletion
import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ('sortable_menu', '0003_menuentry_user_notauto'),
    ]

    operations = [
        migrations.AlterField(
            model_name='menuentry',
            name='owner',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='menu_entries', to=settings.AUTH_USER_MODEL, verbose_name='User that owns the menu entry'),
        ),
    ]
