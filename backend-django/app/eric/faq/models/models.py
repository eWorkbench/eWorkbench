#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from ckeditor_uploader.fields import RichTextUploadingField
from django_changeset.models import RevisionModelMixin

from eric.core.models import BaseModel
from eric.core.models.abstract import ChangeSetMixIn, OrderingModelMixin
from eric.faq.models.managers import FAQCategoryManager, FAQQuestionAndAnswerManager
from eric.search.models import FTSMixin


class FAQCategory(BaseModel, OrderingModelMixin):
    objects = FAQCategoryManager()

    class Meta:
        verbose_name = _("FAQ Category")
        verbose_name_plural = _("FAQ Categories")
        ordering = ("ordering",)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=512, verbose_name=_("title of the FAQ category"), db_index=True)

    slug = models.SlugField(
        max_length=512,
        unique=True,
        db_index=True,
        verbose_name=_("unique slug of the FAQ category"),
    )

    public = models.BooleanField(verbose_name=_("Whether this FAQ category is public"), default=False, db_index=True)

    created_at = models.DateTimeField(
        verbose_name=_("Date when this element was created"),
        auto_now_add=True,  # sets the date when the element is created
        editable=False,
        null=True,
        db_index=True,
    )

    last_modified_at = models.DateTimeField(
        verbose_name=_("Date when this element was last modified"),
        auto_now=True,  # sets the date every time the element is saved
        editable=False,
        null=True,
        db_index=True,
    )

    def __str__(self):
        return self.title


class FAQQuestionAndAnswer(BaseModel, ChangeSetMixIn, RevisionModelMixin, OrderingModelMixin, FTSMixin):
    objects = FAQQuestionAndAnswerManager()

    class Meta:
        verbose_name = _("FAQ Question and Answer")
        verbose_name_plural = _("FAQ Questions and Answers")
        ordering = ("ordering",)
        unique_together = (
            (
                "question",
                "category",
            ),
        )
        fts_template = "fts/faq.html"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    question = models.CharField(verbose_name=_("FAQ question"), max_length=4096, db_index=True)

    answer = RichTextUploadingField(
        config_name="awesome_ckeditor",
        verbose_name=_("FAQ answer"),
        blank=True,
    )

    category = models.ForeignKey("FAQCategory", on_delete=models.CASCADE, related_name="faq_questions_and_answers")

    slug = models.SlugField(
        max_length=512,
        unique=True,
        db_index=True,
        verbose_name=_("Unique slug for linking to this question"),
    )

    public = models.BooleanField(
        verbose_name=_("Whether this FAQ question and answer is public"), default=False, db_index=True
    )

    def __str__(self):
        return self.question


@receiver(pre_save, sender=FAQQuestionAndAnswer)
def set_faq_slug(instance, *args, **kwargs):
    """
    If for some reason a question is missing a slug, automatically set one
    :param instance:
    :return:
    """
    if not instance.slug:
        instance.slug = slugify(instance.question)
