#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from mptt.managers import TreeManager

from eric.core.models import BaseManager
from eric.projects.models.querysets import (
    ElementLockQuerySet,
    ProjectQuerySet,
    ProjectRoleUserAssignmentQuerySet,
    ResourceQuerySet,
    RoleQuerySet,
    UserStorageLimitQuerySet,
)

# create managers for all our important objects
ProjectManager = TreeManager.from_queryset(ProjectQuerySet)
ProjectRoleUserAssignmentManager = BaseManager.from_queryset(ProjectRoleUserAssignmentQuerySet)
ResourceManager = BaseManager.from_queryset(ResourceQuerySet)
RoleManager = BaseManager.from_queryset(RoleQuerySet)
UserStorageLimitManager = BaseManager.from_queryset(UserStorageLimitQuerySet)
ElementLockManager = BaseManager.from_queryset(ElementLockQuerySet)
