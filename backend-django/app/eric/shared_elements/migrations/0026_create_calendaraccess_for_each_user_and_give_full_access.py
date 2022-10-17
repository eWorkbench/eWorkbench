# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations

from django_changeset.models import RevisionModelMixin

from eric.core.models import DisableSignals


def create_calendaraccess_and_full_access(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias
    ContentType = apps.get_model('contenttypes', "ContentType")
    User = apps.get_model('auth', 'User')
    CalendarAccess = apps.get_model('shared_elements', 'CalendarAccess')
    ModelPrivilege = apps.get_model('model_privileges', 'ModelPrivilege')

    # get content type
    calendaraccess_content_type = ContentType.objects.get_for_model(CalendarAccess)

    # iterate over all Users, create a CalendarAccess and give the user full_access
    # If the user never logged in we don't do anything here.
    # There is still a handler that does the same on authentication for "new" users.
    with DisableSignals():  # avoid permission/lock checks
        for user in User.objects.using(db_alias).filter(last_login__isnull=False):
            # check if a CalendarAccess already exists for this user
            privilege_exists = CalendarAccess.objects.using(db_alias).all().filter(
                created_by=user,
            )

            if not privilege_exists:
                new_privilege = CalendarAccess.objects.using(db_alias).create()
                # set created_by and last_modified_by to the user, so the CalendarAccess is his/hers
                new_privilege.created_by = user
                new_privilege.last_modified_by = user
                new_privilege.save()

                # now give the user full_access to his calendar
                perm = ModelPrivilege(
                    user=user,
                    full_access_privilege="AL",
                    content_type=calendaraccess_content_type,
                    object_id=new_privilege.pk
                )
                perm.save()

    RevisionModelMixin.set_enabled(True)


def remove_calendaraccess_and_full_access(apps, schema_editor):
    """
    Remove all entity permission assignments
    :param apps:
    :param schema_editor:
    :return:
    """
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias
    CalendarAccess = apps.get_model('shared_elements', 'CalendarAccess')
    ContentType = apps.get_model('contenttypes', "ContentType")
    ModelPrivilege = apps.get_model('model_privileges', 'ModelPrivilege')

    # get content type
    calendaraccess_content_type = ContentType.objects.using(db_alias).get(
        app_label='shared_elements',
        model='calendaraccess'
    )

    with DisableSignals():
        # remove all CalendarAccess objects
        CalendarAccess.objects.using(db_alias).all().delete()

        # remove all ModelPrivilege objects where the content_type is that of the CalendarAccess
        ModelPrivilege.objects.using(db_alias).all().filter(
            content_type=calendaraccess_content_type,
        ).delete()

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):
    dependencies = [
        ('shared_elements', '0025_calendaraccess'),
    ]

    operations = [
        migrations.RunPython(
            create_calendaraccess_and_full_access,
            remove_calendaraccess_and_full_access
        ),
    ]
