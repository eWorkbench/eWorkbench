#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model

from eric.projects.models import Project
from eric.shared_elements.models import Task, Note

User = get_user_model()

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Print some basic stats of eric workbench'

    def handle(self, *args, **options):
        print("number_of_projects={}".format(Project.objects.all().count()))
        print("number_of_tasks={}".format(Task.objects.all().count()))
        print("number_of_notes={}".format(Note.objects.all().count()))
        print("number_of_users={}".format(User.objects.all().count()))
