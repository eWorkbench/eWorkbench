# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DBLog',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('logger_name', models.CharField(max_length=100, verbose_name='Logger')),
                ('level', models.PositiveSmallIntegerField(choices=[(0, 'NotSet'), (20, 'Info'), (30, 'Warning'), (10, 'Debug'), (40, 'Error'), (50, 'Fatal')], db_index=True, default=40, verbose_name='Log Level')),
                ('message', models.TextField(verbose_name='Message')),
                ('trace', models.TextField(blank=True, null=True, verbose_name='Stack Trace')),
                ('request_info', models.TextField(blank=True, null=True, verbose_name='Request Info')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created at')),
                ('processed', models.BooleanField(default=False, verbose_name='Processing complete')),
                ('user', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='db_logs', to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'Log',
                'verbose_name_plural': 'Logs',
                'ordering': ('-created_at',),
            },
        ),
        migrations.AddIndex(
            model_name='dblog',
            index=models.Index(fields=['message', 'trace'], name='db_logging__message_18933f_idx'),
        ),
    ]
