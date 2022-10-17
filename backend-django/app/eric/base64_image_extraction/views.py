#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import mimetypes

from django.http import FileResponse, Http404

from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from eric.base64_image_extraction.models.models import ExtractedImage
from eric.site_preferences.models import options


class ExtractedImageViewRateThrottle(AnonRateThrottle):
    """Limits the access to an extracted image for anonymous users to avoid brute force attacks"""

    rate = options.extracted_images_rate_limit or "100/min"
    cache_format = "throttle_extracted_image_%(scope)s_%(ident)s"


class ExtractedImageView(APIView):
    """
    Handles images that were extracted from HTML content.
    """

    # make API public, to allow loading images in <img> tags without authentication
    # access check is done via a static "secret" parameter instead
    authentication_classes = ()
    permission_classes = ()

    throttle_classes = (ExtractedImageViewRateThrottle,)

    @staticmethod
    def get(request, *args, **kwargs):
        """Gets a specific image."""
        try:
            extracted_image = ExtractedImage.objects.get(pk=kwargs["pk"], secret=kwargs["secret"])
        except ExtractedImage.DoesNotExist:
            raise Http404

        response = FileResponse(open(extracted_image.image.path, "rb"))
        response["Content-Disposition"] = f'attachment; filename="{extracted_image.image.name}"'
        file_mime = mimetypes.guess_type(extracted_image.image.name)
        if file_mime:
            response["Content-Type"] = f"{file_mime};"
        else:
            response["Content-Type"] = "image/png;"
        return response
