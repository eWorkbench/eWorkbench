#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import mimetypes

from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle

from eric.site_preferences.models import options
from eric.base64_image_extraction.models.models import ExtractedImage


class ExtractedImageViewRateThrottle(AnonRateThrottle):
    """Limits the access to an extracted image for anonymous users to avoid brute force attacks"""
    rate = options.extracted_images_rate_limit or '100/min'
    cache_format = 'throttle_extracted_image_%(scope)s_%(ident)s'


class ExtractedImageView(APIView):
    """
    A very simple view that displays the image in question
    """
    authentication_classes = ()
    permission_classes = ()
    throttle_classes = (ExtractedImageViewRateThrottle, )

    @staticmethod
    def get(request, *args, **kwargs):
        try:
            extracted_image = ExtractedImage.objects.get(
                pk=kwargs['pk'],
                secret=kwargs['secret']
            )
        except ExtractedImage.DoesNotExist:
            raise Http404

        response = FileResponse(open(extracted_image.image.path, 'rb'))
        response['Content-Disposition'] = 'attachment; filename="{}"'.format(extracted_image.image.name)
        file_mime = mimetypes.guess_type(extracted_image.image.name)
        if file_mime:
            response['Content-Type'] = '{};'.format(file_mime)
        else:
            response['Content-Type'] = 'image/png;'
        return response
