#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import (
    BaseFilter,
    BetterBooleanFilter,
    BooleanDefaultFilter,
    ListFilter,
    RecentlyModifiedByMeFilter,
    RecursiveProjectsListFilter,
)
from eric.dss.models import DSSContainer, DSSEnvelope
from eric.dss.models.models import DSSFilesToImport


class DSSContainerFilter(BaseFilter):
    class Meta:
        model = DSSContainer
        fields = {"projects": BaseFilter.FOREIGNKEY_COMPERATORS, "created_by": BaseFilter.FOREIGNKEY_COMPERATORS}

    deleted = BooleanDefaultFilter()

    projects = ListFilter(field_name="projects")

    projects_recursive = RecursiveProjectsListFilter(field_name="projects")

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class DSSEnvelopeFilter(BaseFilter):
    class Meta:
        model = DSSEnvelope
        fields = {"created_by": BaseFilter.FOREIGNKEY_COMPERATORS, "container": BaseFilter.FOREIGNKEY_COMPERATORS}

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class DSSFilesToImportFilter(BaseFilter):
    class Meta:
        model = DSSFilesToImport
        fields = {
            "path": BaseFilter.STRING_COMPERATORS,
        }

    imported = BetterBooleanFilter()
    last_import_attempt_failed = BetterBooleanFilter()
