#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.db import models
from django.utils.translation import ugettext_lazy as _

from rest_framework.reverse import reverse

from django_userforeignkey.models.fields import UserForeignKey
from django_userforeignkey.request import get_current_request

from eric.short_url.models.managers import ShortURLManager


class ShortURL(models.Model):
    """
    A Model that provides short urls for Django
    """
    objects = ShortURLManager()

    class Meta:
        verbose_name = _("Short URL")
        verbose_name_plural = _("Short URLs")

    created_by = UserForeignKey(
        auto_user_add=True,
        verbose_name=_("The user that created the short url")
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("When was this url created")
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name=_("Special primary key of the short url")
    )

    url = models.TextField(
        verbose_name=_("The URL that we redirect to")
    )

    last_accessed = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Last time this url was accessed")
    )

    access_count = models.BigIntegerField(
        default=0,
        verbose_name=_("How often this url was accessed")
    )

    def get_short_url(self):
        """
        Returns the actual short url, based on the current request and the short-url view
        :return:
        """
        request = get_current_request()

        return reverse('short-url', kwargs={'pk': self.pk}, request=request)
