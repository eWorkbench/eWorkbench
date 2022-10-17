#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import models
from django.utils.translation import ugettext_lazy as _


class Statistic(models.Model):
    period = models.CharField(
        verbose_name=_("Period"),
        max_length=100,
    )

    name = models.CharField(
        verbose_name=_("Statistic"),
        max_length=100,
    )

    date = models.DateField(
        verbose_name=_("Date"),
        blank=False,
        null=False,
    )

    count = models.IntegerField(
        blank=False,
        null=False,
    )
