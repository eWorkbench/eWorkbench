# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_changeset.models.mixins
import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('model_privileges', '0005_modelprivilege_trash_privilege'),
    ]

    operations = [
        migrations.AddField(
            model_name='modelprivilege',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AddField(
            model_name='modelprivilege',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, null=True, editable=False, on_delete=django.db.models.deletion.SET_NULL, related_name='modelprivilege_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
        migrations.AddField(
            model_name='modelprivilege',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='modelprivilege',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='modelprivilege_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='modelprivilege',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
    ]
