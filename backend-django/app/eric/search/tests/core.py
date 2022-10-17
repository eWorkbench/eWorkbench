#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.projects.models import Project
from eric.projects.tests.core import ProjectsMixin


class FTSDataMixin(ProjectsMixin):
    def create_test_projects(self, auth_token):
        """Creates test projects via REST API and returns a queryset containing the projects"""
        http_user_agent = "APITestClient"
        http_remote_addr = "127.0.0.1"

        project1_pk = self.rest_create_project(
            auth_token=auth_token,
            project_name="The cat project",
            project_description="<div>The überfat cat set on the mat and ate the fat rat.</div>",
            project_state=Project.STARTED,
            HTTP_USER_AGENT=http_user_agent,
            REMOTE_ADDR=http_remote_addr,
        ).data["pk"]

        project2_pk = self.rest_create_project(
            auth_token=auth_token,
            project_name="The fox project",
            project_description="<div>The quick brown fox jumps over the lazy dog.</div>",
            project_state=Project.STARTED,
            HTTP_USER_AGENT=http_user_agent,
            REMOTE_ADDR=http_remote_addr,
        ).data["pk"]

        project3_pk = self.rest_create_project(
            auth_token=auth_token,
            project_name="The woodchuck project",
            project_description="<div>How much wood would a woodchuck chuck if a woodchuck could chuck wood?</div>",
            project_state=Project.STARTED,
            HTTP_USER_AGENT=http_user_agent,
            REMOTE_ADDR=http_remote_addr,
        ).data["pk"]

        return Project.objects.filter(
            pk__in=[
                project1_pk,
                project2_pk,
                project3_pk,
            ]
        )
