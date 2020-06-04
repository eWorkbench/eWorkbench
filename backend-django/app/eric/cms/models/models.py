#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from ckeditor_uploader.fields import RichTextUploadingField

from django.db import models
from django.utils.translation import gettext_lazy as _
from django_changeset.models import RevisionModelMixin


from eric.core.models import BaseModel
from eric.core.models.abstract import ChangeSetMixIn


class Content(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """
    CMS Content Text
    """

    class Meta:
        verbose_name = _("Text")
        verbose_name_plural = _("Texts")
        track_fields = ('title', 'text',)
        ordering = ('title', )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    slug = models.SlugField(
        max_length=40,
        db_index=True,
        verbose_name=_("Unique Identifier for this content"),
    )

    public = models.BooleanField(
        verbose_name=_("Whether this content is public"),
        default=False,
        db_index=True
    )

    title = models.CharField(
        verbose_name=_("Title of the content"),
        max_length=128,
        db_index=True
    )

    text = RichTextUploadingField(
        config_name='awesome_ckeditor',
        verbose_name=_("Actual text"),
        blank=True,
    )

    def __str__(self):
        return self.title
