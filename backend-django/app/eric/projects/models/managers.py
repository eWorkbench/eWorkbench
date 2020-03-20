#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.projects.models.querysets import ProjectQuerySet, ProjectRoleUserAssignmentQuerySet, RoleQuerySet, \
    ResourceQuerySet, UserStorageLimitQuerySet, ElementLockQuerySet, ResourceBookingQuerySet

# create managers for all our important objects
ProjectManager = BaseManager.from_queryset(ProjectQuerySet)
ProjectRoleUserAssignmentManager = BaseManager.from_queryset(ProjectRoleUserAssignmentQuerySet)
ResourceManager = BaseManager.from_queryset(ResourceQuerySet)
ResourceBookingManager = BaseManager.from_queryset(ResourceBookingQuerySet)
RoleManager = BaseManager.from_queryset(RoleQuerySet)
UserStorageLimitManager = BaseManager.from_queryset(UserStorageLimitQuerySet)
ElementLockManager = BaseManager.from_queryset(ElementLockQuerySet)
