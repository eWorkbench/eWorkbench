#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import logging

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from rest_framework.status import HTTP_201_CREATED, HTTP_200_OK, HTTP_404_NOT_FOUND, HTTP_204_NO_CONTENT, \
    HTTP_403_FORBIDDEN
from rest_framework.test import APITestCase

from eric.dmp.models import Dmp, DmpForm
from eric.dmp.tests.core import DmpsMixin
from eric.labbooks.tests.core import LabBookMixin
from eric.model_privileges.models import ModelPrivilege
from eric.pictures.tests.core import PictureMixin
from eric.projects.models import ElementLock, Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin, TestLockMixin
from eric.shared_elements.models import Task
from eric.shared_elements.tests.core import ContactMixin, MeetingMixin, NoteMixin, TaskMixin, FileMixin
from eric.versions.tests import HTTP_USER_AGENT, REMOTE_ADDRESS, VersionData, pk_or_none, http_info
from eric.versions.tests.helper_mixin import HelperMixin
from eric.versions.tests.rest_mixin import HttpInfo, VersionRestMixin

logger = logging.getLogger(__name__)


class GenericTestContext:
    def __init__(self, endpoint, endpoint_id, content_type):
        self.endpoint = endpoint
        self.endpoint_id = endpoint_id
        self.content_type = content_type


class GenericVersionApiTest(VersionRestMixin, ProjectsMixin, AuthenticationMixin, ModelPrivilegeMixin, TestLockMixin,
                            HelperMixin):
    """ Tests that the versions API behaves as expected for different model types and user permissions """

    def create_model_instance(self, project):
        raise NotImplementedError

    def get_endpoint(self):
        raise NotImplementedError

    def get_model_name(self):
        raise NotImplementedError

    def get_asserter(self):
        raise NotImplementedError

    def create_model_instance_with_privileges(self, project):
        instance, response = self.create_model_instance(project)
        self.get_asserter().assertEquals(response.status_code, HTTP_201_CREATED, "Couldn't create model instance")
        self.set_model_privileges(self.get_endpoint(), self.get_model_name(), instance.pk)

        return instance

    def setUp(self):
        self.user_author, self.token_author = self.create_user_and_login("author", is_superuser=True)
        self.user_full_access, self.token_full_access = self.create_user_and_login("user2-full-access")
        self.user_readonly, self.token_readonly = self.create_user_and_login("user3-readonly")
        self.user_no_access, self.token_no_access = self.create_user_and_login("user4-no-access")

        self.project1 = self.create_project(
            self.token_author,
            "MyProject", "My test project",
            Project.INITIALIZED,
            HTTP_USER_AGENT, REMOTE_ADDRESS)

        # assign the users to the project
        self.assign_user_to_project(self.token_author, self.user_full_access, self.project1)
        self.assign_user_to_project(self.token_author, self.user_readonly, self.project1)
        self.assign_user_to_project(self.token_author, self.user_no_access, self.project1)

    def test_model_api_with_assigned_project(self):
        instance_with_project = self.create_model_instance_with_privileges(self.project1)

        # unlock the model instance (creating it usually locks it)
        response = self.unlock(self.token_author, self.get_endpoint(), instance_with_project.pk,
                               HTTP_USER_AGENT, REMOTE_ADDRESS)

        self.perform_test_with_object(instance_with_project)

    def test_model_api_without_project(self):
        instance_without_project = self.create_model_instance_with_privileges(None)

        # unlock the model instance (creating it usually locks it)
        response = self.unlock(self.token_author, self.get_endpoint(), instance_without_project.pk,
                               HTTP_USER_AGENT, REMOTE_ADDRESS)

        self.perform_test_with_object(instance_without_project)

    def perform_test_with_object(self, model_instance):
        test_context = GenericTestContext(
            endpoint=self.get_endpoint(),
            endpoint_id=model_instance.pk,
            content_type=ContentType.objects.get_for_model(model_instance))

        self.step1__post_first_version(test_context)
        self.step2__post_another_version(test_context)
        self.step3__get_versions(test_context)
        self.step4__preview_version(test_context)
        self.step5__restore_version(test_context)
        self.step6__delete_version(test_context)

    def step1__post_first_version(self, test_context):
        # user with full access posts a version -> should work
        response = self.__step1_post_as_user(self.token_full_access, test_context)
        self.get_asserter().assertEquals(response.status_code, HTTP_201_CREATED,
                                         "Full access user couldn't post version\n%s" % response.content)

        # user with readonly access posts a version -> shouldn't be possible
        response = self.__step1_post_as_user(self.token_readonly, test_context)
        self.get_asserter().assertEquals(response.status_code, HTTP_403_FORBIDDEN,
                                         "Readonly user was able to post version")

        # user with no access posts a version -> shouldn't be possible
        response = self.__step1_post_as_user(self.token_no_access, test_context)
        self.get_asserter().assertEquals(response.status_code, HTTP_404_NOT_FOUND,
                                         "No-access user was able to post version")

        # check that exactly one version has been created
        # and it has the version number 1
        version_list = self.get_version_list(test_context)
        self.get_asserter().assertEquals(len(version_list), 1, "There should exist exactly one version")
        version_data = version_list[0]
        self.get_asserter().assertEquals(version_data['number'], 1, "Version should have number 1")

        # check that there is metadata
        # the metadata import+export itself is tested in shared_elements.tests.test_metadata_export_import
        metadata = version_data['metadata']
        self.get_asserter().assertGreaterEqual(metadata['metadata_version'], 1, "Metadata should have version >= 1")

        # unlock the model instance
        self.unlock(self.token_full_access, self.get_endpoint(), test_context.endpoint_id,
                    HTTP_USER_AGENT, REMOTE_ADDRESS)

    def __step1_post_as_user(self, token, test_context):
        return self.rest_post_version(
            test_context.endpoint,
            test_context.endpoint_id,
            VersionData(
                content_type=test_context.content_type,
                object_id=test_context.endpoint_id,
                summary="Test summary.\nSecond line of test summary.",
            ).as_dict(),
            HttpInfo(token))

    def step2__post_another_version(self, test_context):
        # post another version
        response = self.__step1_post_as_user(self.token_full_access, test_context)
        self.get_asserter().assertEquals(response.status_code, HTTP_201_CREATED, "Couldn't post second version")

        # check that there are 2 versions now and the latest version number is automatically incremented to 2
        version_list = self.get_version_list(test_context)
        self.get_asserter().assertEquals(len(version_list), 2, "There should be two versions now")
        second_version = version_list[0]  # version list is ordered DESC -> first element is latest
        self.get_asserter().assertEquals(second_version['number'], 2, "Second version should have number 2")

        # unlock the model instance
        self.unlock(self.token_full_access, self.get_model_name(), test_context.endpoint_id,
                    HTTP_USER_AGENT, REMOTE_ADDRESS)

    def step3__get_versions(self, test_context):
        # request version list without having access rights
        response = self.rest_get_version_list(
            test_context.endpoint,
            test_context.endpoint_id,
            HttpInfo(self.token_no_access))

        # check that the request fails
        self.get_asserter().assertEquals(response.status_code, HTTP_404_NOT_FOUND,
                                         "User without access rights shouldn't be able to list versions")

        # request specific version without having access rights
        response = self.__step3_get_latest_version(test_context, self.token_no_access)
        self.get_asserter().assertEquals(response.status_code, HTTP_404_NOT_FOUND,
                                         "User without access rights shouldn't be able to see specific version")

        # request specific version with reading rights
        response = self.__step3_get_latest_version(test_context, self.token_readonly)
        self.get_asserter().assertEquals(response.status_code, HTTP_200_OK,
                                         "User with reading rights should be able to see specific version")
        version = json.loads(response.content.decode())
        self.get_asserter().assertGreaterEqual(version['number'], 1)  # just check that there is something there

    def __step3_get_latest_version(self, test_context, token):
        version_list = self.get_version_list(test_context)
        version = version_list[0]
        return self.rest_get_version(
            endpoint=test_context.endpoint,
            endpoint_id=test_context.endpoint_id,
            extension_id=version['pk'],
            http_info=HttpInfo(token))

    def step4__preview_version(self, test_context):
        version_list = self.get_version_list(test_context)
        version_pk = version_list[1]['pk']

        # preview a version without access rights -> must fail
        response = self.preview_version_as(test_context, version_pk, self.token_no_access)
        self.get_asserter().assertEquals(response.status_code, HTTP_404_NOT_FOUND,
                                         "User without access rights shouldn't be able to preview a version")

        # preview a version with readonly access
        response = self.preview_version_as(test_context, version_pk, self.token_readonly)
        self.get_asserter().assertEquals(response.status_code, HTTP_200_OK, response.content.decode())

        # preview a version with full access rights
        response = self.preview_version_as(test_context, version_pk, self.token_full_access)
        self.get_asserter().assertEquals(response.status_code, HTTP_200_OK,
                                         "User with full access rights should be able to preview a version")

    def preview_version_as(self, test_context, version_pk, token):
        return self.rest_preview_version(test_context.endpoint, test_context.endpoint_id, version_pk, HttpInfo(token))

    def step5__restore_version(self, test_context):
        version_list = self.get_version_list(test_context)
        version_pk = version_list[1]['pk']

        # restore a version without access rights -> must fail
        response = self.restore_version_as(test_context, version_pk, self.token_no_access)
        self.get_asserter().assertEquals(response.status_code, HTTP_404_NOT_FOUND,
                                         "User without access rights shouldn't be able to restore a version")

        # restore a version with readonly-access -> must fail
        response = self.restore_version_as(test_context, version_pk, self.token_readonly)
        self.get_asserter().assertEquals(response.status_code, HTTP_403_FORBIDDEN,
                                         "User with readonly-access shouldn't be able to restore a version")

        # restore a version with access rights
        response = self.restore_version_as(test_context, version_pk, self.token_full_access)
        self.get_asserter().assertEquals(response.status_code, HTTP_200_OK,
                                         "User with access rights should be able to restore a version")

    def restore_version_as(self, test_context, version_pk, token):
        return self.rest_restore_version(test_context.endpoint, test_context.endpoint_id, version_pk, HttpInfo(token))

    def step6__delete_version(self, test_context):
        version_list = self.get_version_list(test_context)
        first_version = version_list[1]

        # delete a version without access rights -> must fail
        response = self.rest_delete_version(
            endpoint=test_context.endpoint,
            endpoint_id=test_context.endpoint_id,
            extension_id=first_version['pk'],
            http_info=HttpInfo(self.token_no_access))
        self.get_asserter().assertEquals(response.status_code, HTTP_404_NOT_FOUND,
                                         "User without access rights shouldn't be able to delete a version")

        # delete a version with access rights
        response = self.rest_delete_version(
            endpoint=test_context.endpoint,
            endpoint_id=test_context.endpoint_id,
            extension_id=first_version['pk'],
            http_info=HttpInfo(self.token_full_access))
        self.get_asserter().assertEquals(response.status_code, HTTP_204_NO_CONTENT,
                                         "User with access rights should be able to delete a version")

        # check that there is only one version now
        version_list = self.get_version_list(test_context)
        self.get_asserter().assertEquals(len(version_list), 1, "There should be exactly one version after step 5")

    def get_version_list(self, test_context):
        response = self.rest_get_version_list(
            endpoint=test_context.endpoint,
            endpoint_id=test_context.endpoint_id,
            http_info=HttpInfo(self.token_author))
        self.get_asserter().assertEquals(response.status_code, HTTP_200_OK, "Couldn't get version list")
        return json.loads(response.content.decode())['results']

    def set_model_privileges(self, endpoint, model, pk):
        allow = ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        deny = ModelPrivilege.PRIVILEGE_CHOICES_DENY
        neutral = ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL

        # author has full access automatically

        self.set_model_privilege_for_user(
            self.token_author, endpoint, model, pk, self.user_full_access,
            full_access_privilege=allow)

        self.set_model_privilege_for_user(
            self.token_author, endpoint, model, pk, self.user_readonly,
            view_privilege=allow)

        self.set_model_privilege_for_user(
            self.token_author, endpoint, model, pk, self.user_no_access,
            full_access_privilege=deny,
            view_privilege=deny,
            edit_privilege=deny,
            delete_privilege=deny,
            trash_privilege=deny,
            restore_privilege=deny)


class TaskVersionApiTest(GenericVersionApiTest, APITestCase, TaskMixin):
    def get_endpoint(self):
        return "tasks"

    def get_model_name(self):
        return "task"

    def get_asserter(self):
        return self

    def create_model_instance(self, project):
        return self.create_task_orm(
            auth_token=self.token_author, project_pk=pk_or_none(project),
            title="my task", description="My task description",
            state=Task.TASK_STATE_NEW, priority=Task.TASK_PRIORITY_NORMAL,
            start_date=timezone.now(), due_date=timezone.now(), assigned_user=self.user_author.pk,
            **http_info)


class ContactVersionApiTest(GenericVersionApiTest, APITestCase, ContactMixin):
    def get_endpoint(self):
        return "contacts"

    def get_model_name(self):
        return "contact"

    def get_asserter(self):
        return self

    def create_model_instance(self, project):
        return self.create_contact_orm(
            auth_token=self.token_author, project_pk=pk_or_none(project),
            academic_title="Dr.", first_name="my first name", last_name="my last name", email="first.last@email.com",
            **http_info)


class MeetingVersionApiTest(GenericVersionApiTest, APITestCase, MeetingMixin):
    def get_endpoint(self):
        return "meetings"

    def get_model_name(self):
        return "meeting"

    def get_asserter(self):
        return self

    def create_model_instance(self, project):
        return self.create_meeting_orm(
            auth_token=self.token_author, project_pk=pk_or_none(project),
            title="my project", description="a meeting description",
            start_date=timezone.now(), end_date=timezone.now(),
            **http_info)


class NoteVersionApiTest(GenericVersionApiTest, APITestCase, NoteMixin):
    def get_endpoint(self):
        return "notes"

    def get_model_name(self):
        return "note"

    def get_asserter(self):
        return self

    def create_model_instance(self, project):
        return self.create_note_orm(
            auth_token=self.token_author, project_pk=pk_or_none(project),
            subject="my note", content="Some Note Description",
            **http_info)


class PictureVersionApiTest(GenericVersionApiTest, APITestCase, PictureMixin):
    def get_endpoint(self):
        return "pictures"

    def get_model_name(self):
        return "picture"

    def get_asserter(self):
        return self

    def create_model_instance(self, project):
        return self.create_picture_orm(
            self.token_author, pk_or_none(project),
            "My picture", "demo1.png",
            **http_info)


class FileVersionApiTest(GenericVersionApiTest, APITestCase, FileMixin):
    def get_endpoint(self):
        return "files"

    def get_model_name(self):
        return "file"

    def get_asserter(self):
        return self

    def create_model_instance(self, project):
        return self.create_file_orm(
            self.token_author, pk_or_none(project),
            "my file", "my description", "demo1.txt", pow(2, 20),
            **http_info)


class LabBookVersionApiTest(GenericVersionApiTest, APITestCase, LabBookMixin):
    def get_endpoint(self):
        return "labbooks"

    def get_model_name(self):
        return "labbook"

    def get_asserter(self):
        return self

    def create_model_instance(self, project):
        return self.create_labbook_orm(
            self.token_author, pk_or_none(project),
            "my lab book", False,
            **http_info)


class DmpVersionApiTest(GenericVersionApiTest, APITestCase, DmpsMixin):
    def get_endpoint(self):
        return "dmps"

    def get_model_name(self):
        return "dmp"

    def get_asserter(self):
        return self

    def create_model_instance(self, project):
        dmp_form = DmpForm.objects.create(title="My DMP Form", description="My DMP Form Description")
        return self.create_dmp_orm(
            self.token_author, pk_or_none(project),
            "My DMP", Dmp.PROGRESS, dmp_form.pk,
            **http_info)
