#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.test import APITestCase

from eric.core.models.abstract import get_all_workbench_models, WorkbenchEntityMixin
from eric.dmp.models import Dmp
from eric.drives.models import Drive
from eric.dss.models import DSSContainer
from eric.kanban_boards.models import KanbanBoard
from eric.labbooks.models import LabBook, LabbookSection
from eric.pictures.models import Picture
from eric.plugins.models import PluginInstance
from eric.projects.models import Project, Resource
from eric.projects.tests.core import AuthenticationMixin
from eric.search.models.abstract import FTSMixin
from eric.search.rest.viewsets import SearchViewSet
from eric.search.tests.core import FTSDataMixin
from eric.shared_elements.models import Contact, File, Meeting, Note, Task, Comment


class GlobalFTSSearchTest(APITestCase, AuthenticationMixin, FTSDataMixin):
    """
    Integration tests specific to the workbench setup
    """

    def setUp(self):
        """
        Set up test data
        """
        # set expected searchable models in the workbench application
        self.expected_searchable_models = [
            Contact,
            Dmp,
            Drive,
            File,
            KanbanBoard,
            LabBook,
            LabbookSection,
            Meeting,
            Note,
            Picture,
            PluginInstance,
            Project,
            Resource,
            Task,
            DSSContainer,
            Comment,
        ]

    def _get_searchable_models(self):
        """
        Get all searchable models in the application
        """
        workbench_searchable_elements = get_all_workbench_models(WorkbenchEntityMixin, FTSMixin)
        available_models = dict([(model.__name__.lower(), model) for model in workbench_searchable_elements])

        return available_models.values()

    def test_searchable_models_via_mixins(self):
        """
        Check if the searchable models in the workbench match the expected ones
        -- using the appropriate model Mixins
        """
        searchable_models = self._get_searchable_models()
        self.assertSetEqual(set(searchable_models), set(self.expected_searchable_models))

    def test_searchable_models_via_search_app(self):
        """
        Check if the searchable models in the workbench match the expected ones
        -- using the actual method to get the models from the SearchViewSet
        """
        request = None
        models = SearchViewSet().get_search_models(request)

        self.assertSetEqual(set(models), set(self.expected_searchable_models))
