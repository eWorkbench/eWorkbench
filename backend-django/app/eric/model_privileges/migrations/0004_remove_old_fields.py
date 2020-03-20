# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('model_privileges', '0003_convert_allow_deny_neutral'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='modelprivilege',
            options={'ordering': ['full_access_privilege', 'user__username']},
        ),
        migrations.RemoveField(
            model_name='modelprivilege',
            name='can_delete',
        ),
        migrations.RemoveField(
            model_name='modelprivilege',
            name='can_edit',
        ),
        migrations.RemoveField(
            model_name='modelprivilege',
            name='can_restore',
        ),
        migrations.RemoveField(
            model_name='modelprivilege',
            name='can_view',
        ),
        migrations.RemoveField(
            model_name='modelprivilege',
            name='is_owner',
        ),
        migrations.AlterField(
            model_name='modelprivilege',
            name='delete_privilege',
            field=models.CharField(choices=[('AL', 'Allow'), ('DE', 'Deny'), ('NE', 'Neutral')], db_index=True, default='NE', max_length=2, verbose_name='Whether the user is allowed or not allowed to delete this entity'),
        ),
        migrations.AlterField(
            model_name='modelprivilege',
            name='edit_privilege',
            field=models.CharField(choices=[('AL', 'Allow'), ('DE', 'Deny'), ('NE', 'Neutral')], db_index=True, default='NE', max_length=2, verbose_name='Whether the user is allowed or not allowed to edit this entity'),
        ),
        migrations.AlterField(
            model_name='modelprivilege',
            name='full_access_privilege',
            field=models.CharField(choices=[('AL', 'Allow'), ('DE', 'Deny'), ('NE', 'Neutral')], db_index=True, default='NE', max_length=2, verbose_name='Whether the user has full access on this entity'),
        ),
        migrations.AlterField(
            model_name='modelprivilege',
            name='restore_privilege',
            field=models.CharField(choices=[('AL', 'Allow'), ('DE', 'Deny'), ('NE', 'Neutral')], db_index=True, default='NE', max_length=2, verbose_name='Whether the user is allowed or not allowed to restore this entity'),
        ),
        migrations.AlterField(
            model_name='modelprivilege',
            name='view_privilege',
            field=models.CharField(choices=[('AL', 'Allow'), ('DE', 'Deny'), ('NE', 'Neutral')], db_index=True, default='NE', max_length=2, verbose_name='Whether the user is allowed or not allowed to view this entity'),
        ),
    ]
