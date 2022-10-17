#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django.shortcuts import render
from django.utils.translation import gettext_lazy as _

from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView

from PIL import Image

from eric.core.utils import rfc5987_content_disposition

logger = logging.getLogger(__name__)


class ConvertTiffToPngView(APIView):
    """Handles image conversion from TIF to PNG."""

    def get(self, request, *args, **kwargs):
        """Provides a simple HTML form for the conversion."""

        return render(None, "tiff_to_png.html", {})

    def post(self, request, *args, **kwargs):
        """Takes a multipart TIF file and responds with the converted PNG."""

        if not request.user.is_authenticated:
            raise PermissionDenied

        # retrieve image from uploaded files
        meta_file = request.FILES.get("file")
        file = meta_file.file

        # open file using pillow
        im = Image.open(file)

        # convert CMYK images to RGB
        # https://github.com/python-pillow/Pillow/issues/1380
        if im.mode == "CMYK":
            im = im.convert("RGB")

        # create a "thumbnail" at the same size
        im.thumbnail(im.size)

        # and return it as PNG within a HTTP REsponse
        response = HttpResponse(content_type="image/png")
        im.thumbnail(im.size)
        try:
            im.save(response, "PNG")
        except OSError as err:
            logger.error(f"Error converting tiff to png: {err}")
            raise ValidationError(
                {"background_image": ValidationError(_("The TIF file could not be converted"), code="invalid")}
            )

        filename = f"{meta_file.name}.png"
        response["Content-Disposition"] = rfc5987_content_disposition(filename)

        return response
