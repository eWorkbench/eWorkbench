#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf import settings

cfg = getattr(settings, 'APPOINTMENTS', dict())
CALENDAR_EXPORT_CACHE_SECONDS = cfg.get('CALENDAR_EXPORT_CACHE_SECONDS', 60 * 60)
