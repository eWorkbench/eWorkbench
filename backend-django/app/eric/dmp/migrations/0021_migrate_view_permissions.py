# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dmp', '0020_form_data_as_html'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='dmp',
            options={'ordering': ['title', 'status'], 'permissions': (('trash_dmp', 'Can trash a dmp'), ('restore_dmp', 'Can restore a dmp'), ('add_dmp_without_project', 'Can add a dmp without a project')), 'verbose_name': 'DMP', 'verbose_name_plural': 'DMPs'},
        ),
        migrations.AlterModelOptions(
            name='dmpformdata',
            options={'ordering': ['ordering', 'name', 'type'], 'verbose_name': 'DMP Form Data', 'verbose_name_plural': 'DMP Form Data'},
        ),
    ]
