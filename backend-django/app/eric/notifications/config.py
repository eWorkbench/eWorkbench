#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from datetime import timedelta

from django.conf import settings

cfg = getattr(settings, "NOTIFICATIONS_SETTINGS", dict())

MINIMUM_TIME_BETWEEN_EMAILS = cfg.get("MINIMUM_TIME_BETWEEN_EMAILS", timedelta(minutes=5))
SINGLE_MAIL_NOTIFICATIONS = cfg.get("SINGLE_MAIL_NOTIFICATIONS", list())
