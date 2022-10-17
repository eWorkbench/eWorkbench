#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin
from django.contrib.auth import get_user_model

from eric.short_url.models.models import ShortURL

User = get_user_model()


@admin.register(ShortURL)
class ModelPrivilegeAdmin(admin.ModelAdmin):
    model = ShortURL
    list_display = (
        "id",
        "url",
        "created_by",
    )
    search_fields = (
        "pk",
        "created_by__username",
        "created_by__email",
        "url",
    )
    raw_id_fields = ("created_by",)
