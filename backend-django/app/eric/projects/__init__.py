#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import options

default_app_config = 'eric.projects.apps.ProjectsConfig'

# used to specify which model can have a generic relation
options.DEFAULT_NAMES = options.DEFAULT_NAMES + ('can_have_special_permissions',)
