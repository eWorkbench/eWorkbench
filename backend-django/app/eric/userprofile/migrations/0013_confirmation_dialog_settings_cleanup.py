# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations

persistent_keys = [
    'SkipDialog-ConvertTiff',
    'SkipDialog-DuplicateProject',
    'SkipDialog-DuplicateDMP',
    'SkipDialog-LeaveProject',
    'SkipDialog-MoveElementOutOfSection',
    'SkipDialog-RemoveDirectory',
    'SkipDialog-RemoveElementFromLabbook',
]

deprecated_keys = [
    'SkipDialog-TrashFile',
    'SkipDialog-TrashElementFromDeleteMenu',
    'SkipDialog-TrashElementFromDetailView',
    'SkipDialog-TrashAndDeleteElementFromLabbook',
    'SkipDialog-DeleteColumn',
]

new_key = 'SkipDialog-Trash'


def migrate_forward(apps, schema_editor):
    UserProfile = apps.get_model('userprofile', 'UserProfile')

    for userprofile in UserProfile.objects.all():
        if not userprofile.ui_settings:
            userprofile.ui_settings = dict()

        if 'confirm_dialog' not in userprofile.ui_settings or not userprofile.ui_settings.get('confirm_dialog'):
            userprofile.ui_settings['confirm_dialog'] = dict()

        confirm_dialog = userprofile.ui_settings['confirm_dialog']

        # remove unused settings
        for key in deprecated_keys:
            if key in confirm_dialog:
                del confirm_dialog[key]

        # add new setting
        confirm_dialog[new_key] = True

        # check if persistent settings exist, otherwise add them
        for key in persistent_keys:
            if key not in confirm_dialog:
                confirm_dialog[key] = True

        userprofile.ui_settings['confirm_dialog'] = confirm_dialog
        userprofile.save()


def migrate_downward(apps, schema_editor):
    UserProfile = apps.get_model('userprofile', 'UserProfile')

    for userprofile in UserProfile.objects.all():
        if not userprofile.ui_settings:
            userprofile.ui_settings = dict()

        if 'confirm_dialog' not in userprofile.ui_settings or not userprofile.ui_settings.get('confirm_dialog'):
            userprofile.ui_settings['confirm_dialog'] = dict()

        confirm_dialog = userprofile.ui_settings['confirm_dialog']

        # add unused settings again
        for key in deprecated_keys:
            confirm_dialog[key] = True

        # remove new setting
        if new_key in confirm_dialog:
            del confirm_dialog[new_key]

        # check if persistent settings exist, otherwise add them
        for key in persistent_keys:
            if key not in confirm_dialog:
                confirm_dialog[key] = True

        userprofile.ui_settings['confirm_dialog'] = confirm_dialog
        userprofile.save()


class Migration(migrations.Migration):
    dependencies = [
        ('userprofile', '0012_userprofile_verbose_name'),
    ]

    operations = [
        migrations.RunPython(
            migrate_forward,
            migrate_downward,
        )
    ]
