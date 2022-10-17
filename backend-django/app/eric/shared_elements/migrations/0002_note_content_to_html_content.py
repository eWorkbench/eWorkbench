# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations

import django_cleanhtmlfield.fields

from eric.shared_elements.migrations.utils.helper_0002_note_content_to_html_content import (
    migrate_file_description_to_html,
    migrate_file_html_to_description,
    migrate_meeting_html_to_text,
    migrate_meeting_text_to_html,
    migrate_note_html_to_text,
    migrate_note_text_to_html,
    migrate_task_description_to_html,
    migrate_task_html_to_description,
)


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='note',
            name='content',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Content of the note'),
        ),
        migrations.RunPython(
            migrate_note_text_to_html,
            migrate_note_html_to_text
        ),
        migrations.AlterField(
            model_name='task',
            name='description',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Description of the task'),
        ),
        migrations.RunPython(
            migrate_task_description_to_html,
            migrate_task_html_to_description
        ),
        migrations.AlterField(
            model_name='meeting',
            name='text',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Description of the meeting'),
        ),
        migrations.RunPython(
            migrate_meeting_text_to_html,
            migrate_meeting_html_to_text
        ),
        migrations.AlterField(
            model_name='file',
            name='description',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Description of the file'),
        ),
        migrations.RunPython(
            migrate_file_description_to_html,
            migrate_file_html_to_description
        ),
    ]
