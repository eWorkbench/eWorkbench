#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.db.models import (
    CASCADE,
    PROTECT,
    BooleanField,
    CharField,
    ForeignKey,
    IntegerField,
    OneToOneField,
    UUIDField,
)
from django.utils.translation import gettext_lazy as _

from eric.core.models import BaseModel


class DisplayDesign(BaseModel):
    """
    A string values that defines the look of the display.
    Can be managed in the Django admin and selected for every StudyRoom.
    Is visible to users in the display-export only.
    """

    class Meta:
        verbose_name = _("Display Design")
        verbose_name_plural = _("Displays Designs")

    id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    key = CharField(
        unique=True,
        verbose_name=_("Design Key"),
        max_length=128,
        null=False,
    )

    def __str__(self):
        return self.key if self.key else "<empty string>"


class StudyRoom(BaseModel):
    class Meta:
        verbose_name = _("Study Room")
        verbose_name_plural = _("Study Rooms")

    id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    resource = OneToOneField(
        to="projects.Resource",
        related_name="study_room_info",
        on_delete=CASCADE,
        null=False,
    )

    # todo: make unique (and set null=False) once the current data is migrated and has an assigned room-id
    room_id = IntegerField(
        verbose_name=_("Room ID"),
        # null-values are allowed for now, because there are no RoomIDs for existing data yet
        blank=False,
        null=True,
    )

    # TODO: Create separate model to generalize infrastructure branches
    # TODO: Provide dynamic infrastructure branches via API and adapt frontend
    CHEMISTRY = "CHEM"
    MATH_IT = "MAIT"
    MEDICINE = "MEDIC"
    PHYSICS = "PHY"
    SPORT_HEALTH_SCIENCES = "SHSCI"
    MAIN_CAMPUS = "MCAMP"
    WEIHENSTEPHAN = "WEIH"
    BRANCH_LIBRARY_CHOICES = (
        (CHEMISTRY, "Chemistry"),
        (MATH_IT, "Mathematics & Informatics"),
        (MEDICINE, "Medicine"),
        (PHYSICS, "Physics"),
        (SPORT_HEALTH_SCIENCES, "Sport & Health Sciences"),
        (MAIN_CAMPUS, "Main Campus"),
        (WEIHENSTEPHAN, "Weihenstephan"),
    )
    branch_library = CharField(
        verbose_name=_("Branch Library"),
        max_length=5,
        choices=BRANCH_LIBRARY_CHOICES,
        blank=True,
    )

    display_design = ForeignKey(
        to=DisplayDesign,
        on_delete=PROTECT,
        related_name="study_rooms",
    )

    is_bookable_by_students = BooleanField(
        verbose_name=_("Can be booked by students"),
        default=True,
    )

    @property
    def name(self):
        return self.resource.name

    def __str__(self):
        return self.name
