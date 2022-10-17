# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

import django.contrib.postgres.fields.jsonb
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('kanban_boards', '0017_adjust_column_default_color'),
    ]

    operations = [
        migrations.CreateModel(
            name='KanbanBoardUserFilterSetting',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('settings', django.contrib.postgres.fields.jsonb.JSONField(blank=True, null=True, verbose_name='Kanban Board User Filter Settings')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('kanban_board', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='kanban_board_user_filter_settings', to='kanban_boards.KanbanBoard', verbose_name='Which kanban board is this user filter setting for')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'Kanban Board User Filter Setting',
                'verbose_name_plural': 'Kanban Board User Filter Settings',
                'unique_together': {('kanban_board', 'user')},
                'index_together': {('kanban_board', 'user')},
            },
        ),
    ]
