#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin

from eric.metadata.forms import MetadataFieldForm, MetadataForm
from eric.metadata.models.models import Metadata, MetadataField, MetadataTag


@admin.register(MetadataField)
class MetadataFieldAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "description",
        "base_type",
    )
    list_filter = ("base_type",)
    search_fields = (
        "name",
        "description",
        "base_type",
        "created_by__username",
        "created_by__email",
    )
    ordering = ("name",)
    form = MetadataFieldForm


@admin.register(Metadata)
class MetadataAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "values",
        "field",
        "entity",
    )
    list_filter = ("field",)
    search_fields = (
        "id",
        "field__base_type",
        "values",
        "created_by__username",
        "created_by__email",
    )
    ordering = (
        "entity_id",
        "field",
        "id",
    )
    form = MetadataForm


@admin.register(MetadataTag)
class MetadataTagAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
    )
    search_fields = (
        "id",
        "name",
    )
