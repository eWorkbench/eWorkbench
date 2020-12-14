#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

from eric.core.models import BaseModel
from eric.favourites.models.managers import FavouriteManager

logger = logging.getLogger(__name__)


class Favourite(BaseModel):
    """ Model used to build generic favourites """

    objects = FavouriteManager()

    class Meta:
        verbose_name = _("Favourite")
        verbose_name_plural = _("Favourites")
        track_fields = ("content_type", "object_id", "user_id")
        index_together = (
            ("content_type", "object_id",),
        )
        unique_together = (
            ("object_id", "content_type", "user",),
        )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        get_user_model(),
        verbose_name=_("User"),
        on_delete=models.CASCADE,
    )

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="content_type",
        verbose_name=_("Content type"),
    )

    object_id = models.UUIDField(
        verbose_name=_("Object ID"),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created at"),
    )

    content_object = GenericForeignKey("content_type", "object_id")

    def __str__(self):
        return f"User#{self.user_id} favourite {self.object_id}"

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        # check that only favouritable models are favourited
        meta_class = self.content_object._meta
        if not hasattr(meta_class, 'is_favouritable') or not meta_class.is_favouritable:
            raise ValidationError(f'Instances of model {type(self.content_object)} can not be favourited')

        return super().save(force_insert=False, force_update=False, using=None, update_fields=None)
