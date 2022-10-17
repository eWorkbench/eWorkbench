#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin

from eric.relations.models import Relation


@admin.register(Relation)
class RelationAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "left_content_object",
        "right_content_object",
        "private",
    )
    search_fields = (
        "left_object_id",
        "right_object_id",
        "created_by__username",
        "created_by__email",
    )
    list_per_page = 20
