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
        ('notifications', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='notification',
            options={'ordering': ('-last_modified_at', '-created_at'), 'verbose_name': 'Notification', 'verbose_name_plural': 'Notifications'},
        ),
        migrations.AddField(
            model_name='notification',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified'),
        ),
        migrations.AddField(
            model_name='notification',
            name='last_modified_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notification_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element'),
        ),
        migrations.AddField(
            model_name='notification',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AlterField(
            model_name='notification',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created'),
        ),
        migrations.AlterField(
            model_name='notification',
            name='created_by',
            field=django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notification_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element'),
        ),
    ]
