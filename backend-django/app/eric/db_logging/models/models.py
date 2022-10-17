##
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import hashlib
import logging

from django.db import models
from django.utils.translation import gettext_lazy as _

from django_userforeignkey.models.fields import UserForeignKey

LOG_LEVELS = (
    (logging.NOTSET, _("NotSet")),
    (logging.INFO, _("Info")),
    (logging.WARNING, _("Warning")),
    (logging.DEBUG, _("Debug")),
    (logging.ERROR, _("Error")),
    (logging.FATAL, _("Fatal")),
)


class DBLog(models.Model):
    class Meta:
        verbose_name = _("Log")
        verbose_name_plural = _("Logs")
        ordering = ("-created_at",)
        indexes = [
            # index message + trace to quickly check for duplicates
            models.Index(fields=["message", "trace"])
        ]

    logger_name = models.CharField(
        verbose_name=_("Logger"),
        max_length=100,
    )
    level = models.PositiveSmallIntegerField(
        verbose_name=_("Log Level"),
        choices=LOG_LEVELS,
        default=logging.ERROR,
        db_index=True,
    )
    message = models.TextField(
        verbose_name=_("Message"),
    )
    trace = models.TextField(
        verbose_name=_("Stack Trace"),
        blank=True,
        null=True,
    )
    request_info = models.TextField(
        verbose_name=_("Request Info"),
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(
        verbose_name=_("Created at"),
        auto_now_add=True,
    )
    user = UserForeignKey(
        verbose_name=_("User"),
        auto_user_add=True,
        related_name="db_logs",
    )
    processed = models.BooleanField(
        # e.g. has been sent to devs via email
        verbose_name=_("Processing complete"),
        default=False,
    )
    hash = models.CharField(
        max_length=160,  # SHA1
        null=True,
        blank=True,
    )

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        self.hash = self.compute_hash()
        super().save(force_insert, force_update, using, update_fields)

    def __str__(self):
        level = logging.getLevelName(self.level)
        return f"{self.created_at_formatted} [{level}] {self.message}"

    def compute_hash(self):
        hash_object = hashlib.sha1()
        hash_object.update(self.message.encode("utf-8"))
        if self.trace:
            hash_object.update(self.trace.encode("utf-8"))

        return hash_object.hexdigest()

    @property
    def created_at_formatted(self):
        return self.created_at.strftime("%Y-%m-%d %X")

    @property
    def occurrences(self):
        return DBLog.objects.filter(message=self.message, trace=self.trace)

    @property
    def user_identification(self):
        user = self.user
        if not user:
            return "- no user -"

        user_data = list()
        user_data.append(user.username)

        if user.email:
            user_data.append(user.email)

        if hasattr(user, "userprofile"):
            profile = user.userprofile
            if profile.first_name or profile.last_name:
                user_data.append(f"{profile.first_name} {profile.last_name}")

        return " | ".join(user_data)
