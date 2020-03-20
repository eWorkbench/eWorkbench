# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django_cleanhtmlfield.fields
from eric.projects.models.models import FileSystemStorageLimitByUser
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0083_elementlock'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='resource',
            name='availability',
        ),
        migrations.RenameField(
            model_name='resource',
            old_name='address',
            new_name='location',
        ),
        migrations.RenameField(
            model_name='resource',
            old_name='title',
            new_name='name',
        ),
        migrations.AddField(
            model_name='resource',
            name='contact',
            field=models.TextField(blank=True, default='', verbose_name='Contact of this resource'),
        ),
        migrations.AddField(
            model_name='resource',
            name='inventory_number',
            field=models.CharField(default=uuid.uuid4, max_length=64, null=True, verbose_name='Inventory number of the resource'),
        ),
        migrations.AddField(
            model_name='resource',
            name='projects',
            field=models.ManyToManyField(blank=True, related_name='resources', to='projects.Project', verbose_name='Which projects is this resource associated to'),
        ),
        migrations.AddField(
            model_name='resource',
            name='responsible_unit',
            field=models.CharField(blank=True, default='', max_length=256, verbose_name='Responsible unit of the resource'),
        ),
        migrations.AddField(
            model_name='resource',
            name='terms_of_use_pdf',
            field=models.FileField(blank=True, max_length=512, null=True, storage=FileSystemStorageLimitByUser(), upload_to='', verbose_name='Terms of Use PDF file'),
        ),
        migrations.AddField(
            model_name='resource',
            name='user_availability',
            field=models.CharField(choices=[('GLB', 'Global'), ('PRJ', 'Only for project members'), ('USR', 'Only selected users')], default='GLB', max_length=3, verbose_name='User availability for this resource'),
        ),
        migrations.AddField(
            model_name='resource',
            name='user_availability_selected_users',
            field=models.ManyToManyField(blank=True, related_name='resources', to=settings.AUTH_USER_MODEL, verbose_name='The selected users this resource is available for'),
        ),
        migrations.AlterField(
            model_name='resource',
            name='name',
            field=models.CharField(max_length=256, verbose_name='Name of the resource'),
        ),
        migrations.AlterField(
            model_name='resource',
            name='location',
            field=models.TextField(blank=True, default='', verbose_name='Location of this resource'),
        ),
        migrations.AlterField(
            model_name='resource',
            name='description',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Description of the resource'),
        ),
        migrations.AlterField(
            model_name='resource',
            name='type',
            field=models.CharField(choices=[('ROOM', 'Room'), ('LABEQ', 'Lab Equipment'), ('OFFEQ', 'Office Equipment'), ('ITRES', 'IT-Resource')], default='ROOM', max_length=5, verbose_name='Type of this resource'),
        ),
    ]
