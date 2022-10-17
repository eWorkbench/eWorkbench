#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.base64_image_extraction.models.querysets import ExtractedImageQuerySet
from eric.core.models import BaseManager

# create managers for all our important objects
ExtractedImageManager = BaseManager.from_queryset(ExtractedImageQuerySet)
