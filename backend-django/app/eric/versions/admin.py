#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains basic admin functionality for version elements """

from django.contrib import admin
from django.utils.html import format_html

from eric.versions.forms import VersionForm
from eric.versions.models.models import Version


@admin.register(Version)
class VersionAdmin(admin.ModelAdmin):
    list_display = (
        '__str__',
        'number',
        'content_object_link',
        'content_type',
        'summary',
        'created_at',
    )
    list_filter = (
        'content_type',
        'created_at',
    )
    search_fields = (
        'object_id',
        'summary',
        "created_by__username",
        "created_by__email",
    )
    ordering = (
        'object_id',
        'number',
    )
    form = VersionForm

    @staticmethod
    def content_object_link(item):
        from django.shortcuts import resolve_url
        from django.contrib.admin.templatetags.admin_urls import admin_urlname
        related_object = item.content_object
        if related_object:
            meta_class = related_object.__class__._meta
            url = resolve_url(admin_urlname(meta_class, 'change'), related_object.pk)
            return format_html('<a href="{url}">{name}</a>'.format(url=url, name=str(related_object)))
        else:
            return '- Object does not exist -'
