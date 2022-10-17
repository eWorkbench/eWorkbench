#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import serializers

from eric.faq.models import FAQCategory, FAQQuestionAndAnswer


class FAQCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQCategory
        fields = (
            "title",
            "slug",
            "public",
            "ordering",
        )
        read_only_fields = (
            "title",
            "slug",
            "public",
            "ordering",
        )


class FAQQuestionAndAnswerSerializer(serializers.ModelSerializer):
    category = FAQCategorySerializer(read_only=True)

    class Meta:
        model = FAQQuestionAndAnswer
        fields = (
            "question",
            "answer",
            "public",
            "ordering",
            "category",
            "slug",
        )
        read_only_fields = (
            "question",
            "answer",
            "public",
            "ordering",
            "category",
            "slug",
        )
