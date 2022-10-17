#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.urls import re_path

from eric.base64_image_extraction.views import ExtractedImageView

urlpatterns = [
    re_path(
        r"extractedimage/"
        r"(?P<pk>[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})/"
        r"(?P<secret>[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})/",
        ExtractedImageView.as_view(),
        name="extracted-image",
    )
]
