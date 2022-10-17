#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

import django.db.models.deletion
from django.db import migrations, models
from django.db.migrations import RunPython

from eric.core.models import DisableSignals

INITIAL_DESIGN = 'Default'


def create_initial_export_design(apps, schema_editor):
    DisplayDesign = apps.get_model("resources", "DisplayDesign")
    DisplayDesign.objects.get_or_create(key=INITIAL_DESIGN)


def migrate_study_room_data_forward(apps, schema_editor):
    Resource = apps.get_model("projects", "Resource")
    StudyRoom = apps.get_model("resources", "StudyRoom")
    DisplayDesign = apps.get_model("resources", "DisplayDesign")

    # create StudyRoom entities for resources that were marked as study rooms
    study_room_resource_qs = Resource.objects.filter(study_room=True)
    for resource in study_room_resource_qs:
        StudyRoom.objects.create(
            resource=resource,
            branch_library=resource.branch_library,
            display_design=DisplayDesign.objects.get(key=INITIAL_DESIGN),
        )


def migrate_study_room_data_backwards(apps, schema_editor):
    StudyRoom = apps.get_model("resources", "StudyRoom")

    # re-fill old resource fields from new StudyRoom data
    with DisableSignals():  # prevent locking
        for study_room in StudyRoom.objects.all():
            resource = study_room.resource
            resource.study_room = True
            resource.branch_library = study_room.branch_library
            resource.save()


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('projects', '0101_user_ordering'),
    ]

    operations = [
        migrations.CreateModel(
            name='DisplayDesign',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('key', models.CharField(unique=True, max_length=128, verbose_name='Design Key')),
            ],
            options={
                'verbose_name': 'Display Design',
                'verbose_name_plural': 'Displays Designs',
            },
        ),
        RunPython(
            create_initial_export_design,
            RunPython.noop
        ),
        migrations.CreateModel(
            name='StudyRoom',
            fields=[
                ('id', models.UUIDField(
                    default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                )),
                ('room_id', models.IntegerField(
                    verbose_name='Room ID', null=True,
                )),
                ('branch_library', models.CharField(
                    blank=True, choices=[
                        ('CHEM', 'Chemistry'),
                        ('MAIT', 'Mathematics & Informatics'),
                        ('MEDIC', 'Medicine'), ('PHY', 'Physics'),
                        ('SHSCI', 'Sport & Health Sciences'),
                        ('MCAMP', 'Main Campus'),
                        ('WEIH', 'Weihenstephan')
                    ],
                    max_length=5, verbose_name='Branch Library'
                )),
                ('display_design', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT, related_name='study_rooms',
                    to='resources.DisplayDesign'
                )),
                ('is_bookable_by_students', models.BooleanField(
                    default=True, verbose_name='Can be booked by students'
                )),
                ('resource', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE, related_name='study_room_info', to='projects.Resource'
                )),
            ],
            options={
                'verbose_name': 'Study Room',
                'verbose_name_plural': 'Study Rooms',
            },
        ),
        RunPython(
            migrate_study_room_data_forward,
            migrate_study_room_data_backwards
        )
    ]
