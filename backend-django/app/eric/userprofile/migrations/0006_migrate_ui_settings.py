# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations


def merge_settings_into_ui_settings(apps, schema_editor):
    # Migrates confirm_dialog_settings and dynamic_table_settings into ui-settings

    UserProfile = apps.get_model('userprofile', 'UserProfile')

    for userprofile in UserProfile.objects.all():
        if not userprofile.ui_settings:
            userprofile.ui_settings = dict()

        userprofile.ui_settings['confirm_dialog'] = userprofile.confirm_dialog_settings
        userprofile.ui_settings['dynamic_table'] = userprofile.dynamic_table_settings
        userprofile.save()


def extract_settings_to_old_fields(apps, schema_editor):
    # Extracts settings from ui_settings back to confirm_dialog_settings and dynamic_table_settings

    UserProfile = apps.get_model('userprofile', 'UserProfile')

    for userprofile in UserProfile.objects.all():
        userprofile.confirm_dialog_settings = userprofile.ui_settings.get('confirm_dialog', None)
        userprofile.dynamic_table_settings = userprofile.ui_settings.get('dynamic_table', None)
        userprofile.save()


class Migration(migrations.Migration):
    dependencies = [
        ('userprofile', '0005_userprofile_ui_settings'),
    ]

    operations = [
        migrations.RunPython(
            merge_settings_into_ui_settings,
            extract_settings_to_old_fields,
        )
    ]
