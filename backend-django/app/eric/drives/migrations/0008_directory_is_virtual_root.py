# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
from django_changeset.models import RevisionModelMixin

from eric.core.models import disable_permission_checks


def create_virtual_root_directory(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias

    Directory = apps.get_model("drives", "Directory")
    Drive = apps.get_model("drives", "Drive")

    with disable_permission_checks(Directory):
        with disable_permission_checks(Drive):
            # iterate over all drives
            for drive in Drive.objects.all():
                # get all root directories of this drive
                root_directories = Directory.objects.filter(drive=drive, directory=None)

                if len(root_directories) == 1:
                    # if there is only one root directory, we dedicate this as the new virtual root
                    root_directories.update(is_virtual_root=True, name="/")
                else:
                    # create a new virtual root and move all the others
                    root_directory = Directory.objects.create(
                        drive=drive, directory=None, is_virtual_root=True, name="/"
                    )

                    root_directories.exclude(pk=root_directory.pk).update(directory=root_directory)

    RevisionModelMixin.set_enabled(True)


def remove_virtual_root_directory(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias

    Directory = apps.get_model("drives", "Directory")
    Drive = apps.get_model("drives", "Drive")

    with disable_permission_checks(Directory):
        with disable_permission_checks(Drive):
            # iterate over all drives
            for drive in Drive.objects.all():
                # get all virtual root directories of this drive
                virtual_root_directories = Directory.objects.filter(drive=drive, directory=None, is_virtual_root=True)
                # get all directories that have one of those virtual root directories as parent
                sub_root_directories = Directory.objects.filter(directory__in=virtual_root_directories)
                # update their parents
                sub_root_directories.update(directory=None)
                # and delete virtual root directories
                virtual_root_directories.delete()


    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('drives', '0007_drive_rename'),
    ]

    operations = [
        migrations.AddField(
            model_name='directory',
            name='is_virtual_root',
            field=models.BooleanField(default=False, editable=False, verbose_name='Whether this directory is the virtual root directory of the current drive'),
        ),
        migrations.RunPython(create_virtual_root_directory, remove_virtual_root_directory),
    ]
