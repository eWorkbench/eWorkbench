#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.utils.timezone import datetime, timedelta
from rest_framework.test import APITestCase

from eric.shared_elements.models import Note
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin


class TestGenericNotes(APITestCase, EntityChangeRelatedProjectTestMixin):
    entity = Note

    def setUp(self):
        self.superSetUp()

        self.data = [{
            'subject': "Reminder",
            'content': "<p>Please <u>do</u> it</p>",
            'project_pks': None
        }, {
            'subject': "Agreed",
            'content': "Seems like your way is the way to go!",
            'project_pks': None
        }]
