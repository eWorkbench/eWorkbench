#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains basic admin functionality for extracted images """

from django.contrib import admin
from django.contrib.auth import get_user_model
from eric.base64_image_extraction.models import ExtractedImage

User = get_user_model()


@admin.register(ExtractedImage)
class ExtractedImageAdmin(admin.ModelAdmin):
    model = ExtractedImage
    verbose_name = 'Extracted Image'
    verbose_name_plural = 'Extracted Images'
    can_delete = False
    fields = (
        'pk',
        'secret',
        'image',
        'created_at',
        'created_by',
    )
    readonly_fields = (
        'pk',
        'secret',
        'image',
        'created_at',
        'created_by',
    )
    extra = 0
