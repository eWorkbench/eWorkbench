#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.base64_image_extraction.models import ExtractedImage
from eric.core.rest.serializers import BaseModelSerializer


class ExtractedImageSerializer(BaseModelSerializer):
    """REST API Serializer for ExtractedImage"""

    class Meta:
        model = ExtractedImage
        fields = (
            "pk",
            "secret",
            "image",
        )
