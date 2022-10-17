# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0009_userprofile_anonymized'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='email_others',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.EmailField(blank=True, max_length=128), blank=True, default=list, null=True, size=None, verbose_name='Other E-mail addresses of the user'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='org_zug_mitarbeiter',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=list, null=True, size=None, verbose_name='Which organisation this user belongs to (if the user is an employee)'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='org_zug_mitarbeiter_lang',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=256), blank=True, default=list, null=True, size=None, verbose_name='org_zug_mitarbeiter_lang'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='org_zug_student',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=list, null=True, size=None, verbose_name='Which organization this user belongs to (if the user is a student)'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='org_zug_student_lang',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=256), blank=True, default=list, null=True, size=None, verbose_name='org_zug_student_lang'),
        ),
    ]
