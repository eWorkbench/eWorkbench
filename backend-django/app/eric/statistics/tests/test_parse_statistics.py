#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import shutil
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command

from rest_framework.test import APITestCase

import time_machine

from eric.statistics.models.models import Statistic

User = get_user_model()


class ParseStatisticsTest(
    APITestCase,
):
    def setUp(self):
        pass

    def test_parse_statistics(self):
        #
        #   Test logs are in eric/statistics/management/commands/parse_statistics.py
        #
        kw26 = datetime(2022, 6, 30)
        with time_machine.travel(kw26, tick=False):
            call_command("parse_statistics")
        statistics_labbooks = Statistic.objects.filter(name="Labbooks - Unique user calls")
        self.assertEqual(statistics_labbooks.count(), 2)
        statistics_labbooks = Statistic.objects.filter(
            name="Labbooks - Unique user calls", period="2022 Week 25"
        ).first()
        self.assertEqual(statistics_labbooks.count, 2)
        statistics_projects = Statistic.objects.filter(name="Projects - Unique editors", period="2022 Week 25").first()
        self.assertEqual(statistics_projects.count, 2)
        statistics_labbooks_tasks_usage = Statistic.objects.filter(
            name="Labbooks and Tasks - Unique calls", period="2022 Week 25"
        ).first()
        self.assertEqual(statistics_labbooks_tasks_usage.count, 2)
        statistics_labbooks_tasks_usage = Statistic.objects.filter(
            name="Labbooks and Files - Unique calls", period="2022 Week 25"
        ).first()
        self.assertEqual(statistics_labbooks_tasks_usage.count, 0)
        statistics_labbooks_files_editors = Statistic.objects.filter(
            name="Labbooks and Files - Unique editors", period="2022 Week 25"
        ).first()
        self.assertEqual(statistics_labbooks_files_editors.count, 1)
