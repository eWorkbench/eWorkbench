#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for projects """
from django.conf.urls import url, include

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router

from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet

# projects
from eric.projects.rest.viewsets import PublicUserViewSet, ProjectViewSet, ProjectUsersViewSet, MyUserViewSet, \
    ProjectChangeSetViewSet, ProjectBreadcrumbViewSet, ResourceViewSet, \
    ProjectRoleUserAssignmentViewSet, ProjectRoleUserAssignmentChangeSetViewSet, RoleViewSet, ChangeSetViewSet, \
    MyResourceBookingViewSet, ResourceBookingViewSet, ProjectTreeViewSet

# relations
from eric.relations.rest.viewsets import RelationViewSet

# search
from eric.search.rest.viewsets import SearchViewSet


# register REST API Routers
router = get_api_router()

# personal data routes
router.register(r'me', MyUserViewSet, 'me')

# generic changeset that tracks all changes on all items that the user has access to - available globally
router.register(r'history', ChangeSetViewSet)

# list of all projects (that the user has access to) - available globally
router.register(r'projects', ProjectViewSet)
router.register(r'roles', RoleViewSet)

router.register(r'users', PublicUserViewSet)

# search
router.register(r'search', SearchViewSet, base_name='search')

"""
Resources
with history and relations
"""
router.register(r'resources', ResourceViewSet, base_name='resource')
resources_router = routers.NestedSimpleRouter(router, r'resources', lookup='resource')
resources_router.register(r'relations', RelationViewSet, base_name='resource-relation')
resources_router.register(r'history', GenericChangeSetViewSet, base_name='resource-changeset-paginated')
resources_router.register(r'privileges', ModelPrivilegeViewSet, base_name='resource-privileges')

"""
Resource Bookings
"""
router.register(r'my/resourcebookings', MyResourceBookingViewSet, base_name='myresourcebooking')
router.register(r'resourcebookings', ResourceBookingViewSet, base_name='resourcebooking')
resource_bookings_router = routers.NestedSimpleRouter(router, r'resourcebookings', lookup='resourcebooking')
resource_bookings_router.register(r'history', GenericChangeSetViewSet, base_name='resourcebooking-changeset-paginated')
resource_bookings_router.register(r'privileges', ModelPrivilegeViewSet, base_name='resourcebooking-privileges')

# remaining changeset routes (ToDo: move them to sub routes of the datasets that are affected)
router.register(r'project_role_user_assignment', ProjectRoleUserAssignmentChangeSetViewSet,
                'project_role_user_assignment')
# ToDo: When we refactor resources, we can refactor the resourcesChangeSetViewSet and DMP ChangeSet ViewSet
# router.register(r'texttemplates_changeset', TextTemplateChangeSetViewSet, 'texttemplates_changeset')


# Register a projects router which has project-related sub-routes (such as contacts, meetings, ...)
projects_router = routers.NestedSimpleRouter(router, r'projects', lookup='project',)
projects_router.register(r'relations', RelationViewSet, base_name='project-relation')
projects_router.register(r'acls', ProjectRoleUserAssignmentViewSet, base_name='projectroleuserassignment')
projects_router.register(r'breadcrumbs', ProjectBreadcrumbViewSet, base_name='projectbreadcrumb')
projects_router.register(r'users', ProjectUsersViewSet, base_name='project_users')

# add changeset for projects
projects_router.register(r'history', ProjectChangeSetViewSet, 'projects_changeset')

# projects tree

router.register(r'projecttree', ProjectTreeViewSet, base_name='projecttree')

urlpatterns = [
    # include projects_router and all sub routes
    url(r'^', include(projects_router.urls)),

    # REST Endpoints for resources (history, relations)
    url(r'^', include(resources_router.urls)),

    # REST Endpoints for resource bookings
    url(r'^', include(resource_bookings_router.urls)),
]
