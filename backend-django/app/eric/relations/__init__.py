#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import options

# used to specify which model can have a generic relation
options.DEFAULT_NAMES = options.DEFAULT_NAMES + ('is_relatable',)
