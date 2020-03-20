# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations
import django_cleanhtmlfield.fields

from eric.projects.migrations.utils.helper_0082_project_description_to_html_content import \
    migrate_project_description_to_html, migrate_project_html_to_description


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0081_remove_project_storage_space'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='description',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Description of the Project'),
        ),
        migrations.RunPython(
            migrate_project_description_to_html,
            migrate_project_html_to_description
        ),
    ]
