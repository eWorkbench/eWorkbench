# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0058_remove_task_assigned_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='attending_contacts',
            field=models.ManyToManyField(through='projects.ContactAttendsMeeting', to='projects.Contact'),
        ),
        migrations.AddField(
            model_name='meeting',
            name='attending_users',
            field=models.ManyToManyField(through='projects.UserAttendsMeeting', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='contactattendsmeeting',
            name='meeting',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.Meeting', verbose_name='Attending Meeting'),
        ),
        migrations.AlterField(
            model_name='userattendsmeeting',
            name='meeting',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.Meeting', verbose_name='Attending Meeting'),
        ),
        migrations.AlterUniqueTogether(
            name='contactattendsmeeting',
            unique_together=set([('contact', 'meeting')]),
        ),
        migrations.AlterUniqueTogether(
            name='userattendsmeeting',
            unique_together=set([('user', 'meeting')]),
        ),
    ]
