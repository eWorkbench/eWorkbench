# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


def forwards_func(apps, schema_editor):
    """
    Iterates over all dmps and converts the ForeignKey relationship to project
    into a many to many relationship for projects
    :param apps:
    :param schema_editor:
    :return:
    """
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    Dmp = apps.get_model('dmp', 'Dmp')

    with disable_permission_checks(Dmp):
        # iterate over all tasks
        for dmp in Dmp.objects.using(db_alias).all():
            if dmp.project:
                dmp.projects.add(dmp.project)

    RevisionModelMixin.set_enabled(True)


def reverse_func(apps, schema_editor):
    """
    Iterate over all dmps and take the first projects element from each element and set it on the foreign key relationship
    :param apps:
    :param schema_editor:
    :return:
    """
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    Dmp = apps.get_model('dmp', 'Dmp')

    with disable_permission_checks(Dmp):
        # iterate over all dmps
        for dmp in Dmp.objects.using(db_alias).all():
            if dmp.projects.all().count() > 0:
                dmp.project = dmp.projects.all().first()
                dmp.save()

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('dmp', '0013_dmp_project_relationship'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
