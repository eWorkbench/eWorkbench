#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import uuid

from django_changeset.models import RevisionModelMixin


def create_entity_permission_assignment(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias

    ChangeSet = apps.get_model('django_changeset', "ChangeSet")
    ContentType = apps.get_model('contenttypes', "ContentType")
    User = apps.get_model('auth', 'User')
    Dmp = apps.get_model('dmp', 'dmp')
    ModelPrivilege = apps.get_model('model_privileges', 'ModelPrivilege')

    # get the first superuser as the alternative user
    alternative_user = User.objects.filter(is_superuser=True).first()

    # get all content types
    dmp_content_type = ContentType.objects.using(db_alias).get(
        app_label='dmp',
        model='dmp'
    )

    # iterate over all tasks and create an entity permission assignment
    for dmp in Dmp.objects.using(db_alias).all():
        # get the insert changeset of this object
        insert_changeset = ChangeSet.objects.using(db_alias).filter(
            object_uuid=dmp.pk,
            object_type=dmp_content_type,
            changeset_type='I'
        ).first()

        # if there is no insert changeset, create one
        if not insert_changeset:
            insert_changeset = ChangeSet.objects.using(db_alias).create(
                user=alternative_user,
                object_uuid=dmp.pk,
                object_type=dmp_content_type,
                changeset_type='I'
            )

        created_by = insert_changeset.user

        if not created_by:
            print("DMP with ID {id} does not have created_by, assuming user={user}".format(
                id=dmp.id,
                user=alternative_user
            ))
            created_by = alternative_user

        ModelPrivilege.objects.create(
            user_id=created_by.id,
            content_type=dmp_content_type,
            object_id=dmp.id,
            is_owner=True
        )

    RevisionModelMixin.set_enabled(True)


def clear_entity_permission_assignment(apps, schema_editor):
    """
    Remove all entity permission assignments
    :param apps:
    :param schema_editor:
    :return:
    """
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    ContentType = apps.get_model('contenttypes', "ContentType")

    # get all content types
    dmp_content_type = ContentType.objects.using(db_alias).get(
        app_label='dmp',
        model='dmp'
    )

    ModelPrivilege = apps.get_model('model_privileges', 'ModelPrivilege')
    ModelPrivilege.objects.filter(content_type=dmp_content_type).delete()

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):
    dependencies = [
        ('dmp', '0011_create_without_project_permissions'),
        ('projects', '0050_fix_file_entry_changesets'),
        ('model_privileges', '0007_model_privileges_unique'),
    ]

    operations = [
        migrations.RunPython(
            create_entity_permission_assignment,
            clear_entity_permission_assignment
        ),
    ]


