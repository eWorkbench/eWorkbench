# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations

import django_changeset.models.mixins


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0071_taskchecklist'),
    ]

    operations = [
        migrations.AddField(
            model_name='contactattendsmeeting',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='projectroleuserassignment',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='resource',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='role',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='rolepermissionassignment',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='uploadedfileentry',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='userattendsmeeting',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
    ]
