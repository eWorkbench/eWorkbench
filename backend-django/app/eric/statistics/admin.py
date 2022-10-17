#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin

from eric.statistics.models.models import Statistic


@admin.register(Statistic)
class StatisticAdmin(admin.ModelAdmin):
    list_display = (
        "period",
        "name",
        "date",
        "count",
    )
    readonly_fields = (
        "period",
        "name",
        "date",
        "count",
    )
    list_filter = (
        "name",
        "date",
    )
    search_fields = (
        "period",
        "name",
    )
