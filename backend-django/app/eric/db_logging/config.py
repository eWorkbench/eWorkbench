#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf import settings

cfg = getattr(settings, 'DB_LOGGING_SETTINGS', dict())

ADMIN_LIST_PER_PAGE = cfg.get('ADMIN_LIST_PER_PAGE', 30)
LOG_MAIL_RECEIVERS = [mail for name, mail in settings.ADMINS]
EXCLUDED_LOGGERS = cfg.get('EXCLUDED_LOGGERS', list())
