# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0082_project_description_to_html_content'),
    ]

    operations = [
        migrations.CreateModel(
            name='ElementLock',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('locked_at', models.DateTimeField(auto_now=True)),
                ('object_id', models.UUIDField(verbose_name='Object id of the assigned entity')),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType', verbose_name='Content type of the assigned entity')),
                ('locked_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='locked_elements', to=settings.AUTH_USER_MODEL, verbose_name='Who locked this element')),
            ],
            options={
                'verbose_name_plural': 'Element Locks',
                'verbose_name': 'Element Lock',
            },
        ),
    ]
