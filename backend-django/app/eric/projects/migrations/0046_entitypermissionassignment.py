# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_changeset.models.mixins
import eric.core.admin.is_deleteable
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('contenttypes', '0002_remove_content_type_name'),
        ('projects', '0045_rolepermissionassignment_uuid'),
    ]

    operations = [
        migrations.CreateModel(
            name='ModelPrivilege',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('is_owner', models.BooleanField(db_index=True, default=False, verbose_name='Whether the user is owner of this entity (and can therefore edit, delete, ...) this entity')),
                ('can_view', models.BooleanField(default=False, verbose_name='Whether the user can view this entity or not')),
                ('can_edit', models.BooleanField(default=False, verbose_name='Whether the user can edit this entity or not')),
                ('can_delete', models.BooleanField(default=False, verbose_name='Whether the user can delete this entity or not')),
                ('can_restore', models.BooleanField(default=False, verbose_name='Whether the user can restore this entity or not')),
                ('object_id', models.UUIDField(verbose_name='Object id of the assigned entity')),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='model_privileges', to='contenttypes.ContentType', verbose_name='Content type of the assigned entity')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='model_privileges', to=settings.AUTH_USER_MODEL, verbose_name='User for this entity permission assignment')),
            ],
            options={
                'ordering': ['is_owner', 'user__username'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin, eric.core.admin.is_deleteable.IsDeleteableMixin),
        ),
        migrations.AlterField(
            model_name='rolepermissionassignment',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        migrations.AlterIndexTogether(
            name='modelprivilege',
            index_together=set([('content_type', 'object_id')]),
        ),
    ]
