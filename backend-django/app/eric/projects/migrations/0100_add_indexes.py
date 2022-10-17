# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0099_migrate_view_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='name',
            field=models.CharField(db_index=True, max_length=128, verbose_name='Name of the Project'),
        ),
        migrations.AlterField(
            model_name='project',
            name='project_state',
            field=models.CharField(choices=[('INIT', 'Initialized'), ('START', 'Started'), ('PAUSE', 'Paused'), ('FIN', 'Finished'), ('CANCE', 'Cancelled'), ('DEL', 'Deleted')], db_index=True, default='INIT', max_length=5, verbose_name='State of the Project'),
        ),
        migrations.AlterField(
            model_name='project',
            name='start_date',
            field=models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Project start date'),
        ),
        migrations.AlterField(
            model_name='project',
            name='stop_date',
            field=models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Project stop date'),
        ),
        migrations.AlterField(
            model_name='resource',
            name='branch_library',
            field=models.CharField(blank=True, choices=[('CHEM', 'Chemistry'), ('MAIT', 'Mathematics & Informatics'), ('MEDIC', 'Medicine'), ('PHY', 'Physics'), ('SHSCI', 'Sport & Health Sciences'), ('MCAMP', 'Main Campus'), ('WEIH', 'Weihenstephan')], db_index=True, max_length=5, verbose_name='Branch Library of Study Room'),
        ),
        migrations.AlterField(
            model_name='resource',
            name='name',
            field=models.CharField(db_index=True, max_length=256, verbose_name='Name of the resource'),
        ),
        migrations.AlterField(
            model_name='resource',
            name='study_room',
            field=models.BooleanField(db_index=True, default=False, verbose_name='Study Room'),
        ),
        migrations.AlterField(
            model_name='resource',
            name='type',
            field=models.CharField(choices=[('ROOM', 'Room'), ('LABEQ', 'Lab Equipment'), ('OFFEQ', 'Office Equipment'), ('ITRES', 'IT-Resource')], db_index=True, default='ROOM', max_length=5, verbose_name='Type of this resource'),
        ),
        migrations.AlterField(
            model_name='resource',
            name='user_availability',
            field=models.CharField(choices=[('GLB', 'Global'), ('PRJ', 'Only project members'), ('USR', 'Only selected users')], db_index=True, default='GLB', max_length=3, verbose_name='User availability for this resource'),
        ),
    ]
