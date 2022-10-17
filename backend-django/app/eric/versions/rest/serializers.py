#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.contenttypes.models import ContentType

from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from eric.core.rest.serializers import BaseModelWithCreatedBySerializer
from eric.versions.models.models import Version


class VersionSerializer(BaseModelWithCreatedBySerializer):
    """REST API serializer for version entities"""

    # content_type_pk = content type of the related object
    # content_type (from BaseModelSerializer) = content type of the object itself
    #                                           (= versions.Version)
    content_type_pk = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.all(), source="content_type", many=False, required=True
    )

    # when using the UniqueTogetherValidator bellow, we need to set a default so the number field is not required in
    # the validator.
    # See the Note at: https://www.django-rest-framework.org/api-guide/validators/#uniquetogethervalidator
    number = serializers.IntegerField(required=False, default=0)

    class Meta:
        model = Version
        fields = (
            "number",
            "summary",
            "metadata",
            "content_type_pk",
            "object_id",
        )
        # There is a bug in DRF 3.11, which will be fixed in an upcoming version:
        # https://github.com/encode/django-rest-framework/issues/7100 and
        # https://github.com/encode/django-rest-framework/pull/7143
        # Meanwhile the following workaround will work.
        # The field names are the ones used in the serializer not the ones used in the model.
        validators = [
            UniqueTogetherValidator(queryset=Version.objects.all(), fields=["content_type_pk", "object_id", "number"]),
        ]
