#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_filters import BooleanFilter
from django.contrib.auth import get_user_model
from django.db.models.constants import LOOKUP_SEP

from eric.core.rest.filters import BaseFilter, BooleanDefaultFilter
from eric.core.rest.filters import ListFilter, RecursiveProjectsListFilter, RecentlyModifiedByMeFilter
from eric.projects.models import Project, ProjectRoleUserAssignment, Resource, Role

User = get_user_model()


class ProjectRoleUserAssignmentFilter(BaseFilter):
    """ Filter for Project, which allows filtering by project state (choice) """

    class Meta:
        model = ProjectRoleUserAssignment
        fields = {
            'project': BaseFilter.FOREIGNKEY_COMPERATORS,
            'user': BaseFilter.FOREIGNKEY_COMPERATORS,
            'role': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    project = ListFilter(field_name='project')
    role = ListFilter(field_name='role')
    user = ListFilter(field_name='user')


class ProjectFilter(BaseFilter):
    """ Filter for Project, which allows filtering by project state (choice) """

    class Meta:
        model = Project
        fields = {
            'project_state': BaseFilter.CHOICE_COMPERATORS,
            'parent_project': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    deleted = BooleanDefaultFilter()

    project_state = ListFilter(field_name='project_state')

    @property
    def qs(self):
        # get root-projects and sub-projects where the parent is not viewable
        parent_projects_and_orphans = self.request.GET.get('parent_projects_and_orphans', '')
        if parent_projects_and_orphans:
            return Project.objects.viewable_with_orphans().prefetch_common()

        qs = super().qs

        # recursive parent: get all sub-projects, recursively, under the given project
        recursive_parent_pk = self.request.GET.get('recursive_parent', None)
        if recursive_parent_pk:
            recursive_parent = Project.objects.filter(pk=recursive_parent_pk).first()
            if recursive_parent:
                sub_project_pks = [project.pk for project in recursive_parent.all_sub_projects]
                qs = qs.filter(pk__in=sub_project_pks)

        # load parent projects of the given pk only
        parents_of_pk = self.request.GET.get('parents_of', None)
        if parents_of_pk:
            project = Project.objects.filter(pk=parents_of_pk).first()
            qs = qs.filter(pk__in=project.parent_pk_list).exclude(pk=project.pk)

        # pk and name only
        pk_and_name = self.request.GET.get('pk_and_name', None)
        if pk_and_name:
            qs = qs.values('pk', 'name')

        return qs


class UserFilter(BaseFilter):
    """ Filter for User, which allows filtering by username, first_name and last_name """

    class Meta:
        model = User
        fields = {
            'username': BaseFilter.STRING_COMPERATORS,
        }

    username = ListFilter(field_name='username')


class ResourceFilter(BaseFilter):
    """ Filter for Resource, which allows filtering by type """

    class Meta:
        model = Resource
        fields = {
            'type': BaseFilter.CHOICE_COMPERATORS,
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
            'branch_library': BaseFilter.CHOICE_COMPERATORS,
        }

    deleted = BooleanDefaultFilter()

    projects = ListFilter(field_name='projects')
    study_room = BooleanFilter()

    projects = ListFilter(field_name='projects')

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class RoleFilter(BaseFilter):
    """ Filter for Role, which allows filtering by permission code name """

    class Meta:
        model = Role
        fields = {
            'permission': BaseFilter.CHOICE_COMPERATORS,
        }

    permission = ListFilter(field_name='permissions__codename')
