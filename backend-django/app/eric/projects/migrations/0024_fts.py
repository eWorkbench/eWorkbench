# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.postgres.search
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0023_contact_add_phone_company'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='fts_index',
            field=django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index'),
        ),
        migrations.AddField(
            model_name='project',
            name='fts_language',
            field=models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language'),
        ),
        migrations.AddField(
            model_name='task',
            name='fts_index',
            field=django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index'),
        ),
        migrations.AddField(
            model_name='task',
            name='fts_language',
            field=models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language'),
        ),
        migrations.AddField(
            model_name='contact',
            name='fts_index',
            field=django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index'),
        ),
        migrations.AddField(
            model_name='contact',
            name='fts_language',
            field=models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language'),
        ),
        migrations.AddField(
            model_name='file',
            name='fts_index',
            field=django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index'),
        ),
        migrations.AddField(
            model_name='file',
            name='fts_language',
            field=models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='fts_index',
            field=django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='fts_language',
            field=models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language'),
        ),
        migrations.AddField(
            model_name='note',
            name='fts_index',
            field=django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index'),
        ),
        migrations.AddField(
            model_name='note',
            name='fts_language',
            field=models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language'),
        ),
        migrations.AddField(
            model_name='resource',
            name='fts_index',
            field=django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index'),
        ),
        migrations.AddField(
            model_name='resource',
            name='fts_language',
            field=models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language'),
        ),
    ]
