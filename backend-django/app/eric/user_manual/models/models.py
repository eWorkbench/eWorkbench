#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.core.cache import cache
from django.db import models
from django.utils.translation import gettext_lazy as _

from ckeditor_uploader.fields import RichTextUploadingField
from django_changeset.models import RevisionModelMixin

from eric.core.models import BaseModel
from eric.core.models.abstract import ChangeSetMixIn, OrderingModelMixin


class UserManualCategory(BaseModel, OrderingModelMixin, ChangeSetMixIn, RevisionModelMixin):
    """
    Category for user manuals
    """

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        track_fields = (
            "title",
            "ordering",
            "description",
        )
        ordering = (
            "ordering",
            "title",
        )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(verbose_name=_("Title of the category"), max_length=128, db_index=True, unique=True)

    description = RichTextUploadingField(
        config_name="awesome_ckeditor",
        verbose_name=_("Description of the category"),
        blank=True,
    )

    def __str__(self):
        return self.title


class UserManualPlaceholder(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """
    Placeholders for User Manual
    A placeholder is in the form of "{$key}" and is replaced in the REST API
    """

    class Meta:
        verbose_name = _("Placeholder")
        verbose_name_plural = _("Placeholders")
        track_fields = (
            "key",
            "content",
        )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    key = models.CharField(verbose_name=_("Key of the placeholder"), max_length=128, db_index=True, unique=True)

    content = RichTextUploadingField(config_name="awesome_ckeditor", verbose_name=_("Content of the placeholder"))

    def __str__(self):
        return "{$%s}" % self.key

    @staticmethod
    def get_cached_placeholders():
        """
        Returns a cached list of placeholders
        If the cache is empty, the list is filled from database
        :return:
        """
        from eric.user_manual import PLACEHOLDER_CACHE_KEY

        placeholders = cache.get(PLACEHOLDER_CACHE_KEY, None)

        if not placeholders:
            placeholders = UserManualPlaceholder.objects.all()
            cache.set(PLACEHOLDER_CACHE_KEY, placeholders)

        return placeholders


class UserManualHelpText(BaseModel, OrderingModelMixin, ChangeSetMixIn, RevisionModelMixin):
    """
    User Manual Help Texts
    """

    class Meta:
        verbose_name = _("Help Text")
        verbose_name_plural = _("Help Texts")
        unique_together = (
            (
                "title",
                "category",
            ),
        )
        track_fields = ("title", "ordering", "text", "category")
        ordering = ("ordering",)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(verbose_name=_("Title of the text"), max_length=128, db_index=True)

    text = RichTextUploadingField(
        config_name="awesome_ckeditor",
        verbose_name=_("Actual help text"),
        blank=True,
    )

    category = models.ForeignKey("UserManualCategory", on_delete=models.CASCADE, related_name="help_texts")

    def __str__(self):
        return self.title
