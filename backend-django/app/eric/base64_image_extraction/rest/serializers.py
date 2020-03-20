#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.serializers import BaseModelSerializer
from eric.base64_image_extraction.models import ExtractedImage


class ExtractedImageSerializer(BaseModelSerializer):
    """ REST API Serializer for ExtractedImage """

    class Meta:
        model = ExtractedImage
        fields = (
            'pk',
            'secret',
            'image',
        )
