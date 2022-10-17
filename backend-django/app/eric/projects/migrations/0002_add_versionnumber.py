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
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='contact',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='file',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='meeting',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='note',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='project',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
        migrations.AddField(
            model_name='task',
            name='version_number',
            field=django_changeset.models.mixins.ChangesetVersionField(default=0),
        ),
    ]
