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

    Task = apps.get_model('projects', 'Task')
    Note = apps.get_model('projects', 'Note')
    Meeting = apps.get_model('projects', 'Meeting')
    Contact = apps.get_model('projects', 'Contact')
    File = apps.get_model('projects', 'File')

    # get the first superuser as the alternative user
    alternative_user = User.objects.filter(is_superuser=True).first()

    ModelPrivilege = apps.get_model('projects', 'ModelPrivilege')

    # get all content types
    task_content_type = ContentType.objects.using(db_alias).get(
        app_label='shared_elements',
        model='task'
    )

    note_content_type = ContentType.objects.using(db_alias).get(
        app_label='shared_elements',
        model='note'
    )

    meeting_content_type = ContentType.objects.using(db_alias).get(
        app_label='shared_elements',
        model='meeting'
    )

    contact_content_type = ContentType.objects.using(db_alias).get(
        app_label='shared_elements',
        model='contact'
    )

    file_content_type = ContentType.objects.using(db_alias).get(
        app_label='shared_elements',
        model='file'
    )

    # iterate over all tasks and create an entity permission assignment
    for task in Task.objects.using(db_alias).all():
        # get the insert changeset of this object
        insert_changeset = ChangeSet.objects.using(db_alias).filter(
            object_uuid=task.pk,
            object_type=task_content_type,
            changeset_type='I'
        ).first()

        # if there is no insert changeset, create one
        if not insert_changeset:
            insert_changeset = ChangeSet.objects.using(db_alias).create(
                user=alternative_user,
                object_uuid=task.pk,
                object_type=task_content_type,
                changeset_type='I'
            )

        created_by = insert_changeset.user

        if not created_by:
            print("Task with ID {id} does not have created_by, assuming user={user}".format(
                id=task.id,
                user=alternative_user
            ))
            created_by = alternative_user

        ModelPrivilege.objects.create(
            user_id=created_by.id,
            content_type=task_content_type,
            object_id=task.id,
            is_owner=True
        )

    # iterate over all notes and create an entity permission assignment
    for note in Note.objects.using(db_alias).all():
        insert_changeset = ChangeSet.objects.using(db_alias).filter(
            object_uuid=note.pk,
            object_type=note_content_type,
            changeset_type='I'
        ).first()

        # if there is no insert changeset, create one
        if not insert_changeset:
            insert_changeset = ChangeSet.objects.using(db_alias).create(
                user=alternative_user,
                object_uuid=note.pk,
                object_type=note_content_type,
                changeset_type='I'
            )

        created_by = insert_changeset.user

        if not created_by:
            print("Note with ID {id} does not have created_by, assuming user={user}".format(
                id=note.id,
                user=alternative_user.username
            ))
            created_by = alternative_user

        ModelPrivilege.objects.create(
            user_id=created_by.id,
            content_type=note_content_type,
            object_id=note.id,
            is_owner=True
        )

    # iterate over all meetings and create an entity permission assignment
    for meeting in Meeting.objects.using(db_alias).all():
        insert_changeset = ChangeSet.objects.using(db_alias).filter(
            object_uuid=meeting.pk,
            object_type=meeting_content_type,
            changeset_type='I'
        ).first()

        # if there is no insert changeset, create one
        if not insert_changeset:
            insert_changeset = ChangeSet.objects.using(db_alias).create(
                user=alternative_user,
                object_uuid=meeting.pk,
                object_type=meeting_content_type,
                changeset_type='I'
            )

        created_by = insert_changeset.user

        if not created_by:
            print("Meeting with ID {id} does not have created_by, assuming user={user}".format(
                id=meeting.id,
                user=alternative_user.username
            ))
            created_by = alternative_user

        ModelPrivilege.objects.create(
            user_id=created_by.id,
            content_type=meeting_content_type,
            object_id=meeting.id,
            is_owner=True
        )

    # iterate over all contacts and create an entity permission assignment
    for contact in Contact.objects.using(db_alias).all():
        insert_changeset = ChangeSet.objects.using(db_alias).filter(
            object_uuid=contact.pk,
            object_type=contact_content_type,
            changeset_type='I'
        ).first()

        # if there is no insert changeset, create one
        if not insert_changeset:
            insert_changeset = ChangeSet.objects.using(db_alias).create(
                user=alternative_user,
                object_uuid=contact.pk,
                object_type=contact_content_type,
                changeset_type='I'
            )

        created_by = insert_changeset.user

        if not created_by:
            print("Contact with ID {id} does not have created_by, assuming user={user}".format(
                id=contact.id,
                user=alternative_user.username
            ))
            created_by = alternative_user

        ModelPrivilege.objects.create(
            user_id=created_by.id,
            content_type=contact_content_type,
            object_id=contact.id,
            is_owner=True
        )

    # iterate over all files and create an entity permission assignment
    for file in File.objects.using(db_alias).all():
        insert_changeset = ChangeSet.objects.using(db_alias).filter(
            object_uuid=file.pk,
            object_type=file_content_type,
            changeset_type='I'
        ).first()

        # if there is no insert changeset, create one
        if not insert_changeset:
            insert_changeset = ChangeSet.objects.using(db_alias).create(
                user=alternative_user,
                object_uuid=file.pk,
                object_type=file_content_type,
                changeset_type='I'
            )

        created_by = insert_changeset.user

        if not created_by:
            print("File with ID {id} does not have created_by, assuming user={user}".format(
                id=file.id,
                user=alternative_user.username
            ))
            created_by = alternative_user

        ModelPrivilege.objects.create(
            user_id=created_by.id,
            content_type=file_content_type,
            object_id=file.id,
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

    ModelPrivilege = apps.get_model('projects', 'ModelPrivilege')

    ModelPrivilege.objects.all().delete()

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0046_entitypermissionassignment'),
    ]

    operations = [
        migrations.RunPython(
            create_entity_permission_assignment,
            clear_entity_permission_assignment
        ),
    ]


