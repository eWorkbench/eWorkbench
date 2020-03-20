#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin

from eric.texttemplates.models import TextTemplate


@admin.register(TextTemplate)
class TextTemplateAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'content',
    )
    list_filter = (
        'name',
    )
    search_fields = (
        'name',
        'content',
    )
