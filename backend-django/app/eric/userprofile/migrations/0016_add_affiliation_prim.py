# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0015_userprofile_date_anonymized'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='affiliation_prim',
            field=models.CharField(choices=[('faculty', 'faculty'), ('student', 'student'), ('staff', 'staff'), ('alum', 'alum'), ('member', 'member'), ('affiliate', 'affiliate'), ('employee', 'employee')], default='member', max_length=20, verbose_name='Affiliation prim of the user'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='alum_timestamp',
            field=models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Date when the users affiliation prim was set to alum'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='inactivated_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Date since when the user is inactive'),
        ),
    ]
