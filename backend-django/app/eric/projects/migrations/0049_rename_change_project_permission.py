#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import uuid

from django_changeset.models import RevisionModelMixin


def rename_auth_permission(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias

    Permission = apps.get_model("auth", "Permission")

    permissions = Permission.objects.using(db_alias).filter(
        codename__contains='_change_project'
    )

    for permission in permissions:
        if permission.codename.endswith('_change_project'):
            modelname = permission.codename[0:permission.codename.index('_change_project')]
            new_perm_name = "%s_%s" % ('change_project', modelname)

            print("Renaming permission", permission.codename, "to", new_perm_name)

            permission.codename = new_perm_name
            try:
                permission.save()
            except:
                print('failed to rename, ignoring...')


    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0048_create_without_project_permissions'),
    ]

    operations = [
        migrations.RunPython(
            rename_auth_permission,
            migrations.RunPython.noop
        ),
        migrations.AlterModelOptions(
            name='contact',
            options={'ordering': ['first_name', 'last_name', 'project', 'email'], 'permissions': (('view_contact', 'Can view a contact of a project'), ('change_project_contact', 'Can change the project of a contact'), ('add_contact_without_project', 'Can add a contact without a project')), 'verbose_name': 'Contact', 'verbose_name_plural': 'Contacts'},
        ),
        migrations.AlterModelOptions(
            name='file',
            options={'ordering': ['name', 'path'], 'permissions': (('view_file', 'Can view a file of a project'), ('change_project_file', 'Can change the project of a file'), ('add_file_without_project', 'Can add a file without a project')), 'verbose_name': 'File', 'verbose_name_plural': 'Files'},
        ),
        migrations.AlterModelOptions(
            name='meeting',
            options={'ordering': ['title', 'date_time_start', 'date_time_end', 'text'], 'permissions': (('view_meeting', 'Can view a meeting of a project'), ('change_project_meeting', 'Can change the project of a meeting'), ('add_meeting_without_project', 'Can add a meeting without a project')), 'verbose_name': 'Meeting', 'verbose_name_plural': 'Meetings'},
        ),
        migrations.AlterModelOptions(
            name='note',
            options={'ordering': ['subject', 'content'], 'permissions': (('view_note', 'Can view a note of a project'), ('change_project_note', 'Can change the project of a note'), ('add_note_without_project', 'Can add a note without a project')), 'verbose_name': 'Note', 'verbose_name_plural': 'Notes'},
        ),
        migrations.AlterModelOptions(
            name='task',
            options={'ordering': ['task_id', 'title', 'priority', 'due_date', 'state'], 'permissions': (('view_task', 'Can view a task of a project'), ('change_project_task', 'Can change the project of a task'), ('add_task_without_project', 'Can add a task without a project')), 'verbose_name': 'Task', 'verbose_name_plural': 'Tasks'},
        ),
    ]

