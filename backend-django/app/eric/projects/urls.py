#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for projects """
from django.conf.urls import include
from django.urls import re_path

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.projects.rest.viewsets import (
    ChangeSetViewSet,
    GenericChangeSetViewSet,
    MyUserViewSet,
    ProjectBreadcrumbViewSet,
    ProjectChangeSetViewSet,
    ProjectRoleUserAssignmentChangeSetViewSet,
    ProjectRoleUserAssignmentViewSet,
    ProjectUsersViewSet,
    ProjectViewSet,
    PublicUserViewSet,
    ResourceViewSet,
    RoleViewSet,
)
from eric.relations.rest.viewsets import RelationViewSet
from eric.search.rest.viewsets import SearchViewSet

# register REST API Routers
router = get_api_router()

# personal data routes
router.register(r"me", MyUserViewSet, "me")

# generic changeset that tracks all changes on all items that the user has access to - available globally
router.register(r"history", ChangeSetViewSet)

# list of all projects (that the user has access to) - available globally
router.register(r"projects", ProjectViewSet)
router.register(r"roles", RoleViewSet)

router.register(r"users", PublicUserViewSet)

# search
router.register(r"search", SearchViewSet, basename="search")

"""
Resources
with history and relations
"""
router.register(r"resources", ResourceViewSet, basename="resource")
resources_router = routers.NestedSimpleRouter(router, r"resources", lookup="resource")
resources_router.register(r"relations", RelationViewSet, basename="resource-relation")
resources_router.register(r"history", GenericChangeSetViewSet, basename="resource-changeset-paginated")
resources_router.register(r"privileges", ModelPrivilegeViewSet, basename="resource-privileges")

# remaining changeset routes
router.register(
    r"project_role_user_assignment", ProjectRoleUserAssignmentChangeSetViewSet, "project_role_user_assignment"
)


# Register a projects router which has project-related sub-routes (such as contacts, meetings, ...)
projects_router = routers.NestedSimpleRouter(
    router,
    r"projects",
    lookup="project",
)
projects_router.register(r"relations", RelationViewSet, basename="project-relation")
projects_router.register(r"acls", ProjectRoleUserAssignmentViewSet, basename="projectroleuserassignment")
projects_router.register(r"breadcrumbs", ProjectBreadcrumbViewSet, basename="projectbreadcrumb")
projects_router.register(r"users", ProjectUsersViewSet, basename="project_users")

# add changeset for projects
projects_router.register(r"history", ProjectChangeSetViewSet, "projects_changeset")

urlpatterns = [
    # include projects_router and all sub routes
    re_path(r"^", include(projects_router.urls)),
    # REST Endpoints for resources (history, relations)
    re_path(r"^", include(resources_router.urls)),
]
