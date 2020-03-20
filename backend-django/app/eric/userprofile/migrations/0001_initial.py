# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion
import eric.userprofile.models.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0073_move_myuser_and_userprofile',),
    ]

    state_operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('first_name', models.CharField(blank=True, max_length=128, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=128, verbose_name='last name')),
                ('academic_title', models.CharField(blank=True, max_length=128, verbose_name='Academic title of the user')),
                ('additional_information', models.TextField(blank=True, verbose_name='Additional informations of the user')),
                ('country', models.CharField(blank=True, max_length=128, verbose_name='Country of the user')),
                ('email_others', django.contrib.postgres.fields.ArrayField(base_field=models.EmailField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='Other E-mail addresses of the user')),
                ('org_zug_mitarbeiter', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='Which organisation this user belongs to (if the user is an employee)')),
                ('org_zug_mitarbeiter_lang', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='org_zug_mitarbeiter_lang')),
                ('org_zug_student', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='Which organization this user belongs to (if the user is a student)')),
                ('org_zug_student_lang', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=128), blank=True, default=[], null=True, size=None, verbose_name='org_zug_student_lang')),
                ('phone', models.CharField(blank=True, max_length=128, verbose_name='Phone number of the user')),
                ('salutation', models.CharField(blank=True, max_length=128, verbose_name='Salutation of the user')),
                ('title_salutation', models.CharField(blank=True, max_length=128, verbose_name='Salutation title of the user')),
                ('title_pre', models.CharField(blank=True, max_length=128, verbose_name='Pre title of the user')),
                ('title_post', models.CharField(blank=True, max_length=128, verbose_name='Post title of the user')),
                ('type', models.CharField(choices=[('u', 'Normal User'), ('l', 'LDAP User')], default='u', max_length=5, verbose_name='Type of the user object')),
                ('avatar', models.ImageField(default='unknown_user.gif', height_field='avatar_height', max_length=255, upload_to=eric.userprofile.models.models.UploadToPathAndRename('profile_pictures'), verbose_name='Avatar of the user', width_field='avatar_width')),
                ('avatar_height', models.PositiveIntegerField(blank=True, editable=False, null=True)),
                ('avatar_width', models.PositiveIntegerField(blank=True, editable=False, null=True)),
                ('website', models.URLField(blank=True, null=True, verbose_name='URL of the User')),
                ('jwt_verification_token', models.CharField(default='', max_length=128, verbose_name='Verification Token for JWT')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
                'ordering': ['-pk'],
            },
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(state_operations=state_operations)
    ]
