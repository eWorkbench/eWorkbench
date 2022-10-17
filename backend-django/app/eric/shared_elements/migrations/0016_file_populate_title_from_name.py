# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations

from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks
from eric.versions.models import Version


def forwards_func(apps, schema_editor):
    """
    Iterates over all files and sets the new title field to the value of the current name field
    :param apps:
    :param schema_editor:
    :return:
    """
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    File = apps.get_model('shared_elements', 'File')

    with disable_permission_checks(File):
        with disable_permission_checks(Version):
            # iterate over all files
            for file in File.objects.using(db_alias).all():
                # set the title to the content of name
                file.title = file.name
                # set the name to the original_filename
                file.name = file.original_filename
                file.save()
                # get all versions for this file

    RevisionModelMixin.set_enabled(True)


def reverse_func(apps, schema_editor):
    """
    We do nothing here
    :param apps:
    :param schema_editor:
    :return:
    """
    db_alias = schema_editor.connection.alias


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0015_add_file_title'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
