#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid
from django.db import models
from django_changeset.models import RevisionModelMixin, ChangesetVersionField
from django.utils.translation import ugettext_lazy as _
from eric.core.models import BaseModel
from eric.core.models.abstract import ChangeSetMixIn
from eric.texttemplates.managers import TextTemplateManager


class TextTemplate(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """ Defines a TextTemplate """

    objects = TextTemplateManager()

    class Meta:
        verbose_name = _("Text Template")
        verbose_name_plural = _("Text Templates")
        ordering = ["name"]
        permissions = (
            ("view_texttemplate", "Can view text templates"),
        )
        track_fields = ('name', 'content')

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=128,
        verbose_name=_("Name of the text template")
    )

    content = models.TextField(
        verbose_name=_("Content of the text template"),
        blank=True
    )

    def __str__(self):
        return self.name
