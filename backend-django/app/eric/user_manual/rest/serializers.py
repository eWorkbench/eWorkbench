#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from urllib.parse import urlparse

from django.contrib.auth import get_user_model

from rest_framework import serializers

from bs4 import BeautifulSoup
from django_userforeignkey.request import get_current_request
from rest_framework_nested.relations import NestedHyperlinkedIdentityField

from eric.core.rest.serializers import BaseModelSerializer, BaseModelWithCreatedBySerializer, HyperlinkedToListField
from eric.user_manual.models import UserManualCategory, UserManualHelpText, UserManualPlaceholder

User = get_user_model()


def is_absolute(url):
    """
    Whether the provided URL is absolute or not
    :param url:
    :return:
    """
    return urlparse(url).netloc == ""


class BaseUrlHtmlField(serializers.CharField):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def to_representation(self, value):
        request = get_current_request()

        # parse value with beautifulsoup
        doc = BeautifulSoup(value, "html.parser")

        for tag in doc.findAll("img"):
            # check if a src attribute is set on this tag
            if "src" in tag.attrs:
                src_url = tag.attrs["src"]

                if is_absolute(src_url):
                    # modify the url with the request url
                    tag.attrs["src"] = request.build_absolute_uri(src_url)

            # process srcset
            if "srcset" in tag.attrs:
                srcset = tag.attrs["srcset"].split(",")

                for idx, srcset_item in enumerate(srcset):

                    # split the string by space
                    srcset_item_sep = srcset_item.strip().split(" ")

                    src_url = srcset_item_sep[0]

                    if is_absolute(src_url):
                        srcset_item_sep[0] = request.build_absolute_uri(src_url)
                        srcset[idx] = " ".join(srcset_item_sep)

                tag.attrs["srcset"] = ", ".join(srcset)

        return doc.encode_contents(formatter="html").decode()


class BaseUrlHtmlWithPlaceholdersField(BaseUrlHtmlField):
    def to_representation(self, value):
        # get all placeholders
        placeholders = UserManualPlaceholder.get_cached_placeholders()

        for placeholder in placeholders:
            value = value.replace("{$" + placeholder.key + "}", placeholder.content)

        return super().to_representation(value)


class UserManualCategorySerializer(BaseModelWithCreatedBySerializer):
    """Serializer for User Manual Category"""

    # url for file-list
    help_texts = HyperlinkedToListField(
        view_name="usermanualcategory-usermanualhelptext-list", lookup_field_name="usermanualcategory_pk"
    )

    class Meta:
        model = UserManualCategory
        fields = (
            "title",
            "description",
            "ordering",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "help_texts",
            "url",
        )


class UserManualHelpTextSerializer(BaseModelWithCreatedBySerializer):
    """Serializer for User Manual Help Text"""

    class InternalUserManualCategorySerializer(BaseModelSerializer):
        class Meta:
            model = UserManualCategory
            fields = (
                "title",
                "description",
                "ordering",
            )

    url = NestedHyperlinkedIdentityField(
        view_name="usermanualcategory-usermanualhelptext-detail",
        parent_lookup_kwargs={"usermanualcategory_pk": "category__pk"},
        lookup_url_kwarg="pk",
        lookup_field="pk",
    )

    category = InternalUserManualCategorySerializer(read_only=True)

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=UserManualCategory.objects.all(), source="category", many=False, required=False, allow_null=True
    )

    text = BaseUrlHtmlWithPlaceholdersField()

    class Meta:
        model = UserManualHelpText
        fields = (
            "title",
            "text",
            "category",
            "category_id",
            "ordering",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "version_number",
            "url",
        )
