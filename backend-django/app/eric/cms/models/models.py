#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from ckeditor_uploader.fields import RichTextUploadingField
from django_changeset.models import RevisionModelMixin
from django_userforeignkey.models.fields import UserForeignKey

from eric.cms.models.managers import LaunchScreenManager
from eric.core.models import BaseModel
from eric.core.models.abstract import ChangeSetMixIn, OrderingModelMixin

METADATA_VERSION_KEY = "metadata_version"
UNHANDLED_VERSION_ERROR = NotImplementedError("Unhandled metadata version")


class Content(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """
    CMS Content Text
    """

    class Meta:
        verbose_name = _("Text")
        verbose_name_plural = _("Texts")
        track_fields = (
            "title",
            "text",
        )
        ordering = ("title",)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    slug = models.SlugField(
        max_length=40,
        db_index=True,
        verbose_name=_("Unique Identifier for this content"),
    )

    public = models.BooleanField(verbose_name=_("Whether this content is public"), default=False, db_index=True)

    title = models.CharField(verbose_name=_("Title of the content"), max_length=128, db_index=True)

    text = RichTextUploadingField(
        config_name="awesome_ckeditor",
        verbose_name=_("Actual text"),
        blank=True,
    )

    def __str__(self):
        return self.title


class LaunchScreen(BaseModel, ChangeSetMixIn, RevisionModelMixin, OrderingModelMixin):
    objects = LaunchScreenManager()

    class Meta:
        verbose_name = _("Launch screen")
        verbose_name_plural = _("Launch screens")
        track_fields = (
            "title",
            "text",
        )
        ordering = ("ordering",)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    show_screen = models.BooleanField(
        verbose_name=_("Whether this screen should be shown"),
        default=False,
        db_index=True,
    )

    version = models.CharField(
        verbose_name=_("Version"),
        max_length=16,
    )

    title = models.CharField(
        verbose_name=_("Title of the launch screen"),
        max_length=128,
        db_index=True,
    )

    text = RichTextUploadingField(
        config_name="awesome_ckeditor",
        verbose_name=_("Actual text"),
        blank=True,
    )

    def __str__(self):
        return self.title

    def export_metadata(self):
        """Exports in the latest format"""
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "title": self.title,
            "version": self.version,
            "show_screen": self.show_screen,
            "text": self.text,
        }

    def restore_metadata(self, metadata):
        version = metadata.get(METADATA_VERSION_KEY)
        if version == 1:
            self.__restore_metadata_v1(metadata)
        else:
            raise UNHANDLED_VERSION_ERROR

    def __restore_metadata_v1(self, metadata):
        self.title = metadata.get("title")
        self.version = metadata.get("version")
        self.show_screen = metadata.get("show_screen")
        self.text = metadata.get("text")


class AcceptedScreen(BaseModel, ChangeSetMixIn):
    class Meta:
        verbose_name = _("Accepted screen")
        verbose_name_plural = _("Accepted screens")

    launch_screen = models.ForeignKey(
        "LaunchScreen",
        verbose_name=_("The launch screen which has been accepted by the user"),
        on_delete=models.CASCADE,
    )

    accepted_version = models.CharField(
        verbose_name=_("Version of the launch screen which has been accepted by the user"),
        max_length=16,
    )

    accepted_timestamp = models.DateTimeField(
        verbose_name=_("Last modified date of the launch screen which has been accepted by the user"),
    )

    def __str__(self):
        return _("{} accepted {} with version {}").format(
            self.created_by.username, self.launch_screen.title, self.accepted_version
        )
