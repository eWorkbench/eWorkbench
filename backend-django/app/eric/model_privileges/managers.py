#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.model_privileges.querysets import ModelPrivilegeQuerySet

ModelPrivilegeManager = BaseManager.from_queryset(ModelPrivilegeQuerySet)
