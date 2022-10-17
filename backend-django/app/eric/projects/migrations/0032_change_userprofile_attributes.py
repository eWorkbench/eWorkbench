# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0031_task_state_finished'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='skype_name',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='website',
        ),
        migrations.AddField(
            model_name='userprofile',
            name='country',
            field=models.CharField(blank=True, max_length=128, verbose_name='Country of the user'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='email_others',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.EmailField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='Other E-mail addresses of the user'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='org_zug_mitarbeiter',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='org_zug_mitarbeiter'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='org_zug_mitarbeiter_lang',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='org_zug_mitarbeiter_lang'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='org_zug_student',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='org_zug_student'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='org_zug_student_lang',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='org_zug_student_lang'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='phone',
            field=models.CharField(blank=True, max_length=128, verbose_name='Phone number of the user'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='salutation',
            field=models.CharField(blank=True, max_length=128, verbose_name='Salutation of the user'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='title_post',
            field=models.CharField(blank=True, max_length=128, verbose_name='Post title of the user'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='title_pre',
            field=models.CharField(blank=True, max_length=128, verbose_name='Pre title of the user'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='title_salutation',
            field=models.CharField(blank=True, max_length=128, verbose_name='Salutation title of the user'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='type',
            field=models.CharField(choices=[('u', 'Normal User'), ('l', 'LDAP User')], default='u', max_length=5, verbose_name='Type of the user object'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='academic_title',
            field=models.CharField(blank=True, max_length=128, verbose_name='Academic title of the user'),
        ),
    ]
