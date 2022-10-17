# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models

import eric.projects.models.models
from eric.core.models import UploadToPathAndRename


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0011_added_project_state_deleted'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='file',
            options={'ordering': ['name', 'path'], 'permissions': (('view_file', 'Can view a file of a project'), ('file_change_project', 'Can change the project of a file')), 'verbose_name': 'File', 'verbose_name_plural': 'Files'},
        ),
        migrations.AlterModelOptions(
            name='projectroleuserassignment',
            options={'permissions': (('view_projectroleuserassignment', 'Can view the project role user assignment'),)},
        ),
        migrations.AlterField(
            model_name='note',
            name='content',
            field=models.TextField(blank=True, verbose_name='Content of the note'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='avatar',
            field=models.ImageField(default='unknown_user.gif', height_field='avatar_height', max_length=255, upload_to=UploadToPathAndRename('profile_pictures'), verbose_name='Avatar of the user', width_field='avatar_width'),
        ),
    ]
