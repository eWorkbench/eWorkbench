# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pictures', '0008_reference_archived_picture'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='picture',
            options={'ordering': ['title'], 'permissions': (('trash_picture', 'Can trash a picture'), ('restore_picture', 'Can restore a picture'), ('change_project_picture', 'Can change the project of a picture'), ('add_picture_without_project', 'Can add a picture without a project')), 'verbose_name': 'Picture', 'verbose_name_plural': 'Pictures'},
        ),
    ]
