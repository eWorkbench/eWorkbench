#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import serializers

from eric.projects.models import Project


class ProjectPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    A special project primary key related field, which only displays the Projects that are viewable by the current user
    """
    def get_queryset(self):
        # return all projects here, we are checking whether the user is allowed to add to this project in another method
        return Project.objects.all()
