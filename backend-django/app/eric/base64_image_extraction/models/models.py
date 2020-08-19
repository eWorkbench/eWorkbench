#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import uuid

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.deconstruct import deconstructible
from django.utils.translation import ugettext_lazy as _
from django_userforeignkey.models.fields import UserForeignKey

from eric.core.models import BaseModel, UploadToPathAndRename
from eric.base64_image_extraction.models.managers import ExtractedImageManager

__all__ = [
    'ExtractedImage',
]


class ExtractedImage(BaseModel):
    """
    A Model for extracted images
    """
    objects = ExtractedImageManager()

    class Meta:
        verbose_name = _("Extracted Image")
        verbose_name_plural = _("Extracted Images")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    secret = models.UUIDField(
        default=uuid.uuid4,
        editable=False
    )

    image = models.ImageField(
        verbose_name=_("Extracted image"),
        blank=False,
        null=False,
        max_length=512,
        upload_to=UploadToPathAndRename('extracted_images'),
    )

    source_field = models.CharField(
        max_length=128,
        verbose_name=_("Model field the image was extracted from")
    )

    created_at = models.DateTimeField(
        auto_now=True
    )

    created_by = UserForeignKey(
        auto_user_add=True,
        verbose_name=_("Who extracted this element"),
        related_name="extracted_images"
    )

    # mandatory fields for generic relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name="extracted_images")
    object_id = models.UUIDField()
    source = GenericForeignKey()

    def __str__(self):
        return self.image.name
