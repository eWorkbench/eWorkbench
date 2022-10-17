#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from django_changeset.models import CreatedModifiedByMixIn

from eric.core.models import BaseModel
from eric.core.models.fields import AutoIncrementIntegerWithPrefixField


class Version(BaseModel, CreatedModifiedByMixIn):
    """Defines a version, which can be associated to anything (project, contact, milestone, ...)"""

    class Meta:
        verbose_name = _("Version")
        verbose_name_plural = _("Versions")
        unique_together = (
            "content_type",
            "object_id",
            "number",
        )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    # generic foreign key
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")

    # Stores some metadata specific to this version of the linked entity
    # (e.g. creation date and author of one task version)
    metadata = models.JSONField(
        verbose_name=_("Meta data for this version of the related entity"), null=False, blank=True
    )

    number = AutoIncrementIntegerWithPrefixField(
        verbose_name=_("Version number"),
        prefix_lookup="object_id",
    )

    summary = models.TextField(
        verbose_name=_("Summary of the version"),
        blank=True,
        default="",
    )

    def __str__(self):
        return _("Version {nr} of {object}").format(
            nr=self.number,
            object=str(self.content_object),
        )
