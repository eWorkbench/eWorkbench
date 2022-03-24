#
# Copyright (C) 2016-2021 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin

from eric.faq.models import FAQQuestionAndAnswer, FAQCategory


@admin.register(FAQCategory)
class FAQCategoryAdmin(admin.ModelAdmin):
    fields = (
        'title',
        'slug',
        'ordering',
        'public',
    )

    list_display = (
        'title',
        'slug',
        'ordering',
        'public',
    )

    prepopulated_fields = {"slug": ("title",)}


@admin.register(FAQQuestionAndAnswer)
class FAQQuestionAndAnswerAdmin(admin.ModelAdmin):
    class Media:
        css = {
            'all': (
                'eric/admin/css/dmp_form_admin.css',
            ),
        }
        js = (
            'ckeditor/ckeditor/ckeditor.js',
            'eric/admin/js/dmp_form_admin.js',
        )

    fields = (
        'question',
        'slug',
        'answer',
        'ordering',
        'category',
        'public',
    )

    list_display = (
        'question',
        'slug',
        'answer',
        'category',
        'public',
        'created_at',
        'last_modified_at',
        'ordering',
    )

    search_fields = (
        'question',
        'answer',
        'category__title',
        'category__slug',
    )

    prepopulated_fields = {"slug": ("question",)}

    # allow copy of an object
    save_as = True
