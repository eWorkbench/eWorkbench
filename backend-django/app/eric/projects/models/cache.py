#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.cache import cache

ALL_PROJECTS_CACHE_KEY = 'projects_all_projects'


def get_cache_key_for_sub_projects(pk):
    return 'all_sub_projects_of_{}'.format(pk)


def invalidate_project_cache():
    """ Invalidates cached projects and sub-projects """

    # import Project here to avoid circular dependency
    from eric.projects.models import Project

    # get project PKs from cache
    projects = Project.get_all_projects()
    project_pks_from_cache = [p.pk for p in projects]

    # extend with project PKs from database (make sure all projects PKs are collected)
    project_pks_from_database = list(Project.objects.all().values_list('pk', flat=True))

    # invalidate sub project cache
    all_project_pks = set(project_pks_from_cache + project_pks_from_database)
    for pk in all_project_pks:
        cache_key = get_cache_key_for_sub_projects(pk)
        cache.delete(cache_key)

    # invalidate general project cache
    cache.delete(ALL_PROJECTS_CACHE_KEY)
