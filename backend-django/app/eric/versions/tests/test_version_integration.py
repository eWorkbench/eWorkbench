#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import copy

from rest_framework.status import HTTP_201_CREATED, HTTP_200_OK, HTTP_204_NO_CONTENT
from rest_framework.test import APITestCase

from eric.dmp.models import DmpForm, DmpFormField, Dmp
from eric.dmp.tests.core import DmpsMixin
from eric.labbooks.tests.core import LabBookMixin
from eric.model_privileges.models import ModelPrivilege
from eric.pictures.models import Picture
from eric.pictures.tests.core import PictureMixin
from eric.projects.models import ElementLock, Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin, TestLockMixin
from eric.shared_elements.models import Task, File, Note, disable_permission_checks
from eric.shared_elements.tests.core import ContactMixin, MeetingMixin, NoteMixin, TaskMixin, \
    ContactAttendsMeetingMixin, UserAttendsMeetingMixin, ElementLabelMixin, FileMixin
from eric.versions.tests import HTTP_USER_AGENT, REMOTE_ADDRESS, VersionData, get_json_content, \
    get_utc_datetime, http_info
from eric.versions.tests.helper_mixin import HelperMixin
from eric.versions.tests.rest_mixin import HttpInfo, VersionRestMixin


class GenericVersionIntegrationTest(VersionRestMixin, ProjectsMixin, AuthenticationMixin,
                                    ModelPrivilegeMixin, TestLockMixin, HelperMixin):
    """
    Tests that the endpoints /restore and /preview return the correct data
    and that /restore has the expected effect on the database
    """

    def get_endpoint(self):
        'Gets the endpoint, e.g. "files"'
        raise NotImplementedError

    def get_model_name(self):
        'Gets the model name, e.g. "file"'
        raise NotImplementedError

    def get_asserter(self):
        'Gets the object that is used to assert expectations (e.g. self from APITestCase)'
        raise NotImplementedError

    def unlock_model(self, token, pk):
        'Unlocks the given model'
        if not token:
            token = self.token_su

        return self.unlock(token, self.get_endpoint(), pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

    def create_initial_model_instance(self):
        raise NotImplementedError

    def modify_model_instance(self, model_pk):
        raise NotImplementedError

    def load_model_from_api(self, pk):
        raise NotImplementedError

    def assert_database_still_has_modified_values_after_preview(self, actual):
        'Checks that the actual model did not change after previewing a version'
        raise NotImplementedError

    def assert_response_has_initial_values(self, initial, actual):
        raise NotImplementedError

    def assert_database_has_initial_values(self, initial, actual):
        "Usually the same as assert_response_has_initial_values()"
        self.assert_response_has_initial_values(initial, actual)

    def setUp(self):
        self.set_up_users()
        self.set_up_projects()

    def set_up_users(self):
        self.superuser, self.token_su = self.create_user_and_login("su-author", is_superuser=True)
        self.http_info = HttpInfo(auth_token=self.token_su, user_agent=HTTP_USER_AGENT, remote_address=REMOTE_ADDRESS)
        self.user1, self.token1 = self.create_user_and_login("user1")
        self.user2, self.token2 = self.create_user_and_login("user2")

    def set_up_projects(self):
        self.project1 = self.create_project(self.token_su, "MyProject", "My test project",
                                            Project.INITIALIZED, **http_info)
        self.project2 = self.create_project(self.token_su, "MySecondProject", "My second project",
                                            Project.INITIALIZED, **http_info)
        self.project3 = self.create_project(self.token_su, "MyThirdProject", "My third project",
                                            Project.INITIALIZED, **http_info)

        # create a temporary project, which we will delete after creating the first version
        self.project_tmp = self.create_project(
            self.token_su, "tmp project", "tmp", Project.INITIALIZED, **http_info)

    def allow_model_access(self, endpoint, model, pk, user):
        self.set_model_privilege_for_user(
            self.token_su, endpoint, model, pk, user,
            full_access_privilege=ModelPrivilege.ALLOW)

    def test_export_restore(self):
        endpoint = self.get_endpoint()
        model_name = self.get_model_name()

        # create initial model instance and allow access
        model, response = self.create_initial_model_instance()
        self.get_asserter().assertEquals(HTTP_201_CREATED, response.status_code, "Couldn't create %s" % model_name)
        self.allow_model_access(endpoint, model_name, model.pk, self.user1)

        # create initial version
        self.create_version(endpoint, model.pk)

        # delete temporary objects, modify models
        self.delete_tmp_project()
        response = self.modify_model_instance(model.pk)
        self.get_asserter().assertEquals(HTTP_200_OK, response.status_code, "Couldn't modify %s" % model_name)

        # unlock model
        self.unlock_model(self.token_su, model.pk)

        # preview the latest version
        version = self.load_latest_version(self.http_info, model)
        response = self.preview_version(self.http_info, model.pk, version['pk'])
        actual = get_json_content(response)
        # check that the response values match those of the previewed version
        self.assert_response_has_initial_values(model, actual)
        # check that the actual values did not change
        response = self.load_model_from_api(model.pk)
        actual = get_json_content(response)
        self.assert_database_still_has_modified_values_after_preview(actual)

        # restore latest version and check the response
        response = self.restore_latest_version(model)
        self.get_asserter().assertEquals(HTTP_200_OK, response.status_code, "Couldn't restore %s" % model_name)
        actual = get_json_content(response)
        self.assert_response_has_initial_values(model, actual)

        # unlock model
        self.unlock_model(self.token_su, model.pk)

        # check that the database has the correct values too
        response = self.load_model_from_api(model.pk)
        self.get_asserter().assertEquals(HTTP_200_OK, response.status_code, "Couldn't get %s" % model_name)
        actual = get_json_content(response)
        self.assert_database_has_initial_values(model, actual)

        # restore instance as user1 (not assigned to any project)
        self.restore_latest_version(model, HttpInfo(self.token1))

        # check that there is no project assignment
        response = self.load_model_from_api(model.pk)
        self.get_asserter().assertEquals(HTTP_200_OK, response.status_code, "Couldn't GET %s" % model_name)
        actual = get_json_content(response)
        self.get_asserter().assertEquals(set(), set(actual['projects']))

    def restore_latest_version(self, obj, http_info=None):
        if http_info is None:
            http_info = self.http_info

        version = self.load_latest_version(http_info, obj)
        return self.restore_version(http_info, obj.pk, version['pk'])

    def restore_version(self, http_info, obj_pk, version_pk):
        response = self.rest_restore_version(self.get_endpoint(), obj_pk, version_pk, http_info)
        self.get_asserter().assertEquals(response.status_code, HTTP_200_OK, response.content.decode())
        return response

    def preview_version(self, http_info, obj_pk, version_pk):
        response = self.rest_preview_version(self.get_endpoint(), obj_pk, version_pk, http_info)
        self.get_asserter().assertEquals(response.status_code, HTTP_200_OK, response.content.decode())
        return response

    def load_latest_version(self, http_info, obj):
        response = self.rest_get_version_list(self.get_endpoint(), obj.pk, http_info)
        self.get_asserter().assertEquals(response.status_code, HTTP_200_OK, "Couldn't GET version list")
        version_list = get_json_content(response)['results']
        return version_list[0]

    def create_version(self, endpoint, pk):
        data = VersionData(object_id=pk, summary="My version").as_dict()
        response = self.rest_post_version(endpoint, pk, data, self.http_info)
        self.get_asserter().assertEquals(response.status_code, HTTP_201_CREATED)

    def delete_tmp_project(self):
        response = self.rest_trash_project(self.token_su, self.project_tmp.pk, **http_info)
        self.get_asserter().assertEquals(HTTP_200_OK, response.status_code)
        response = self.rest_delete_project(self.token_su, self.project_tmp.pk, **http_info)
        self.get_asserter().assertEquals(HTTP_204_NO_CONTENT, response.status_code)

    def assert_key_equal(self, expected_dict, actual_dict, key):
        self.get_asserter().assertEquals(expected_dict[key], actual_dict[key])

    def assert_set_key_equal(self, expected_dict, actual_dict, key):
        self.get_asserter().assertSetEquals(set(expected_dict[key]), set(actual_dict[key]))


class TaskVersionIntegrationTest(GenericVersionIntegrationTest, APITestCase, TaskMixin, ElementLabelMixin):
    def get_endpoint(self):
        return "tasks"

    def get_model_name(self):
        return "task"

    def get_asserter(self):
        return self

    def create_initial_model_instance(self):
        self.label1_pk = self.create_label("label1")
        self.label2_pk = self.create_label("label2")
        self.label3_pk = self.create_label("label3")

        self.initial_data = {
            "title": "my init title",
            "description": "my init desc",
            "state": Task.TASK_STATE_NEW,
            "priority": Task.TASK_PRIORITY_HIGH,
            "start_date": get_utc_datetime(2001, 1, 2),
            "due_date": get_utc_datetime(2002, 3, 4),
            "user_pks": [self.superuser.pk, self.user1.pk],
            "project_pks": [self.project1.pk, self.project_tmp.pk, self.project2.pk],
            "checklist": [
                {'title': 'item1', 'checked': 'false'},
                {'title': 'item2', 'checked': 'false'},
                {'title': 'item3', 'checked': 'true'}
            ],
            "label_pks": [self.label1_pk, self.label2_pk]
        }

        init = self.initial_data

        task, create_response = self.create_task_orm(
            auth_token=self.token_su, project_pk=init['project_pks'],
            title=init['title'], description=init['description'],
            state=init['state'], priority=init['priority'],
            start_date=init['start_date'], due_date=init['due_date'],
            assigned_user=init['user_pks'],
            **http_info)

        # add checklist items
        response = self.rest_update_task_checklist_items(
            self.token_su, task.pk, init['checklist'], **http_info)
        self.assertEquals(HTTP_200_OK, response.status_code, "Couldn't update checklist")

        # create and assign labels
        self.update_task_labels(task.pk, self.initial_data['label_pks'])

        return task, create_response

    def load_model_from_api(self, pk):
        return self.rest_get_task(self.token_su, pk, **http_info)

    def update_task_labels(self, task_pk, label_pks):
        data = {
            "labels": label_pks
        }
        response = self.rest_update_task_partial(self.token_su, task_pk, data, **http_info)
        self.assertEquals(HTTP_200_OK, response.status_code, "Couldn't update task labels")

    def create_label(self, name):
        response = self.rest_create_label(self.token_su, name, "rgba(0,0,0,0)", **http_info)
        self.assertEquals(HTTP_201_CREATED, response.status_code, "Couldn't create label")
        return get_json_content(response)['pk']

    def modify_model_instance(self, model_pk):
        self.modified_data = {
            'project_pks': [self.project3.pk],
            'title': 'modified title',
            'description': 'modified description',
            'state': Task.TASK_STATE_DONE,
            'priority': Task.TASK_PRIORITY_VERY_LOW,
            'start_date': get_utc_datetime(1922, 5, 6),
            'due_date': get_utc_datetime(1933, 7, 8),
            'user_pks': [self.superuser.pk],
            'label_pks': [self.label3_pk],
            'checklist': [
                {'title': 'new item1', 'checked': 'false'},
                {'title': 'new item2', 'checked': 'true'},
            ],
        }
        mod = self.modified_data

        update_response = self.rest_update_task(
            auth_token=self.token_su, task_pk=model_pk, project_pks=mod['project_pks'], title=mod['title'],
            description=mod['description'], state=mod['state'], priority=mod['priority'],
            start_date=mod['start_date'], due_date=mod['due_date'],
            assigned_user=mod['user_pks'], **http_info)

        # modify labels
        self.update_task_labels(model_pk, mod['label_pks'])

        # modify checklist items
        response = self.rest_update_task_checklist_items(
            self.token_su, model_pk, mod['checklist'], **http_info)
        self.assertEquals(HTTP_200_OK, response.status_code, "Couldn't update checklist")

        return update_response

    def assert_database_still_has_modified_values_after_preview(self, actual):
        self.assert_data_equal(self.modified_data, actual)

    def assert_response_has_initial_values(self, initial, actual):
        # remove temporary values from expected results
        expected = copy.deepcopy(self.initial_data)
        project_pks = expected['project_pks']
        project_pks.remove(self.project_tmp.pk)
        expected['project_pks'] = project_pks

        self.assert_data_equal(expected, actual)

    def assert_data_equal(self, expected, actual):
        self.assert_key_equal(expected, actual, 'title')
        self.assert_key_equal(expected, actual, 'description')
        self.assert_key_equal(expected, actual, 'state')
        self.assert_key_equal(expected, actual, 'priority')

        self.assertEquals(expected['start_date'].astimezone().isoformat(), actual['start_date'])
        self.assertEquals(expected['due_date'].astimezone().isoformat(), actual['due_date'])

        expected_projects = {str(pk) for pk in expected['project_pks']}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

        expected_users = set(expected['user_pks'])
        actual_users = set(actual['assigned_users_pk'])
        self.assertSetEqual(expected_users, actual_users)

        expected_labels = set(expected['label_pks'])
        actual_labels = set(actual['labels'])
        self.assertSetEqual(expected_labels, actual_labels)

        def normalize_checklist(checklist):
            return {i['title'] + str(i['checked']).lower() for i in checklist}

        expected_checklist = normalize_checklist(expected['checklist'])
        actual_checklist = normalize_checklist(actual['checklist_items'])
        self.assertSetEqual(expected_checklist, actual_checklist)


class ContactVersionIntegrationTest(GenericVersionIntegrationTest, APITestCase, ContactMixin):
    def get_asserter(self):
        return self

    def get_endpoint(self):
        return "contacts"

    def get_model_name(self):
        return "contact"

    def create_initial_model_instance(self):
        return self.create_contact_orm(
            auth_token=self.token_su,
            project_pk=[self.project1.pk, self.project_tmp.pk, self.project2.pk],
            academic_title="Dr.", first_name="init first name",
            last_name="init last name", email="init@email.com", company="init company", phone="0043664123456",
            **http_info)

    def modify_model_instance(self, model_pk):
        return self.rest_update_contact(
            auth_token=self.token_su, contact_id=model_pk, project_pks=self.project3.pk,
            academic_title="modified title",
            firstname="modified first name", lastname="modified last name", email="modified@mail.com",
            company="modified company", phone="0",
            **http_info)

    def assert_database_still_has_modified_values_after_preview(self, actual):
        self.assertEquals("modified first name", actual['first_name'])
        self.assertEquals("modified last name", actual['last_name'])
        self.assertEquals("modified title", actual['academic_title'])
        self.assertEquals("modified@mail.com", actual['email'])
        self.assertEquals("modified company", actual['company'])
        self.assertEquals("0", actual['phone'])

        expected_projects = {str(self.project3.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

    def load_model_from_api(self, pk):
        return self.rest_get_contact(self.token_su, pk, **http_info)

    def assert_response_has_initial_values(self, initial, actual):
        self.assertEquals(initial.first_name, actual['first_name'])
        self.assertEquals(initial.last_name, actual['last_name'])
        self.assertEquals(initial.academic_title, actual['academic_title'])
        self.assertEquals(initial.email, actual['email'])
        self.assertEquals(initial.company, actual['company'])
        self.assertEquals(initial.phone, actual['phone'])

        expected_projects = {str(self.project1.pk), str(self.project2.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)


class MeetingVersionIntegrationTest(GenericVersionIntegrationTest, APITestCase, MeetingMixin, UserAttendsMeetingMixin,
                                    ContactAttendsMeetingMixin, ContactMixin):
    def get_asserter(self):
        return self

    def get_endpoint(self):
        return "meetings"

    def get_model_name(self):
        return "meeting"

    def create_initial_model_instance(self):
        # create meeting contacts
        self.contact1, response = self.create_contact_orm(
            auth_token=self.token_su,
            project_pk=[self.project1.pk],
            academic_title="Dr.", first_name="contact1",
            last_name="contact1", email="c1@email.com", company="c1 company", phone="004366411111111",
            **http_info)
        self.assertEquals(HTTP_201_CREATED, response.status_code, "Couldn't create contact 1")

        self.contact_tmp, response = self.create_contact_orm(
            auth_token=self.token_su,
            project_pk=[self.project1.pk],
            academic_title="Mag.", first_name="c2firstname",
            last_name="c2lastname", email="c2@email.com", company="c2company", phone="00436642222222",
            **http_info)
        self.assertEquals(HTTP_201_CREATED, response.status_code, "Couldn't create contact 2")

        # create initial meeting
        return self.create_meeting_orm(
            auth_token=self.token_su, project_pk=[self.project1.pk, self.project_tmp.pk],
            title="init title", description="a meeting description",
            start_date=get_utc_datetime(2001, 1, 1), end_date=get_utc_datetime(2002, 2, 2),
            attending_users=[self.user1.pk, self.user2.pk], attending_contacts=[self.contact1.pk, self.contact_tmp.pk],
            **http_info)

    def modify_model_instance(self, model_pk):
        # delete temporary contact
        response = self.rest_trash_contact(self.token_su, self.contact_tmp.pk, **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't trash attending contact")
        response = self.rest_delete_contact(self.token_su, self.contact_tmp.pk, **http_info)
        self.assertEquals(response.status_code, HTTP_204_NO_CONTENT, "Couldn't delete attending contact")

        response = self.update_attending_contacts(
            self.token_su, model_pk, [], **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, response.content.decode())

        response = self.update_attending_users(
            self.token_su, model_pk, [self.superuser.pk], **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, response.content.decode())

        return self.rest_update_meeting(
            meeting_id=model_pk, project_pks=self.project3.pk,
            auth_token=self.token_su, title="modified", description="modified",
            start_date=get_utc_datetime(1903, 3, 3), end_date=get_utc_datetime(1904, 4, 4),
            **http_info)

    def assert_database_still_has_modified_values_after_preview(self, actual):
        self.assertEquals("modified", actual['title'])
        self.assertEquals("modified", actual['text'])

        expected_start_date = get_utc_datetime(1903, 3, 3).astimezone().isoformat()
        self.assertEquals(expected_start_date, actual['date_time_start'])

        expected_end_date = get_utc_datetime(1904, 4, 4).astimezone().isoformat()
        self.assertEquals(expected_end_date, actual['date_time_end'])

        expected_projects = {str(self.project3.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

        expected_contacts = set()
        actual_contacts = set(actual['attending_contacts_pk'])
        self.assertSetEqual(expected_contacts, actual_contacts)

        expected_users = {self.superuser.pk}
        actual_users = set(actual['attending_users_pk'])
        self.assertSetEqual(expected_users, actual_users)

    def load_model_from_api(self, pk):
        return self.rest_get_meeting(self.token_su, pk, **http_info)

    def assert_response_has_initial_values(self, initial, actual):
        self.assertEquals(initial.title, actual['title'])
        self.assertEquals(initial.text, actual['text'])

        expected_start_date = initial.date_time_start.astimezone().isoformat()
        self.assertEquals(expected_start_date, actual['date_time_start'])

        expected_end_date = initial.date_time_end.astimezone().isoformat()
        self.assertEquals(expected_end_date, actual['date_time_end'])

        expected_projects = {str(self.project1.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

        # Meeting author automatically attends
        expected_users = {self.superuser.pk, self.user1.pk, self.user2.pk}
        actual_users = set(actual['attending_users_pk'])
        self.assertSetEqual(expected_users, actual_users)

        expected_contacts = {str(self.contact1.pk)}
        actual_contacts = set(actual['attending_contacts_pk'])
        self.assertSetEqual(expected_contacts, actual_contacts)


class NoteVersionIntegrationTest(GenericVersionIntegrationTest, APITestCase, NoteMixin):
    def get_asserter(self):
        return self

    def get_endpoint(self):
        return "notes"

    def get_model_name(self):
        return "note"

    def create_initial_model_instance(self):
        return self.create_note_orm(
            auth_token=self.token_su, project_pk=[self.project1.pk, self.project_tmp.pk],
            subject="init title", content="Some Note Description",
            **http_info)

    def modify_model_instance(self, model_pk):
        return self.rest_update_note(
            auth_token=self.token_su, note_pk=model_pk, project_pks=self.project2.pk,
            subject="modified", content="modified",
            **http_info)

    def assert_database_still_has_modified_values_after_preview(self, actual):
        self.assertEquals("modified", actual['subject'])
        self.assertEquals("modified", actual['content'])

        expected_projects = {str(self.project2.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

    def load_model_from_api(self, pk):
        return self.rest_get_note(self.token_su, pk, **http_info)

    def assert_response_has_initial_values(self, initial, actual):
        self.assertEquals(initial.subject, actual['subject'])
        self.assertEquals(initial.content, actual['content'])

        expected_projects = {str(self.project1.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)


class PictureVersionIntegrationTest(GenericVersionIntegrationTest, APITestCase, PictureMixin):
    initial_background_image = None
    initial_rendered_image = None
    initial_shapes_image = None

    def get_asserter(self):
        return self

    def get_endpoint(self):
        return "pictures"

    def get_model_name(self):
        return "picture"

    def create_initial_model_instance(self):
        picture, create_response = self.create_picture_orm(
            self.token_su, [self.project1.pk, self.project_tmp.pk],
            "My picture", "demo1.png", **http_info)
        self.assertEquals(create_response.status_code, HTTP_201_CREATED, "Couldn't create picture")

        response = self.rest_update_picture_rendered_image_file(
            self.token_su, picture.pk, "demo2.png", **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't update rendered image")

        response = self.rest_update_picture_shape_file(
            self.token_su, picture.pk, "demo1.json", **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't update shape")

        # store initially generated values
        response = self.load_model_from_api(picture.pk)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't load picture")
        initial_picture = get_json_content(response)
        self.initial_background_image = initial_picture['download_background_image']
        self.initial_rendered_image = initial_picture['download_rendered_image']
        self.initial_shapes_image = initial_picture['download_shapes']

        return picture, create_response

    def modify_model_instance(self, model_pk):
        response = self.rest_update_picture(
            self.token_su, model_pk, [self.project2.pk],
            "My new picture title", "demo2.png", **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't update picture")

        response = self.rest_update_picture_rendered_image_file(
            self.token_su, model_pk, "demo1.png", **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't update rendered image")

        response = self.rest_update_picture_shape_file(
            self.token_su, model_pk, "demo2.json", **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't update shape")

        json = get_json_content(response)
        self.modified_download_shapes = json['download_shapes']
        self.modified_download_rendered_image = json['download_rendered_image']
        self.modified_download_background_image = json['download_background_image']

        return response

    def assert_database_still_has_modified_values_after_preview(self, actual):
        self.assertEquals("My new picture title", actual['title'])
        self.assert_url_equal_without_parameters(
            self.modified_download_background_image, actual['download_background_image'])
        self.assert_url_equal_without_parameters(
            self.modified_download_rendered_image, actual['download_rendered_image'])
        self.assert_url_equal_without_parameters(
            self.modified_download_shapes, actual['download_shapes'])

        expected_projects = {str(self.project2.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

    def load_model_from_api(self, pk):
        return self.rest_get_picture(self.token_su, pk, **http_info)

    def assert_response_has_initial_values(self, initial, actual):
        self.assertEquals(initial.title, actual['title'])
        self.assertEquals(initial.width, actual['width'])
        self.assertEquals(initial.height, actual['height'])
        self.assert_url_equal_without_parameters(self.initial_background_image, actual['download_background_image'])
        self.assert_url_equal_without_parameters(self.initial_rendered_image, actual['download_rendered_image'])
        self.assert_url_equal_without_parameters(self.initial_shapes_image, actual['download_shapes'])

        expected_projects = {str(self.project1.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

    def assert_url_equal_without_parameters(self, url1, url2):
        self.assertEquals(self.strip_url_parameters(url1), self.strip_url_parameters(url2))

    @staticmethod
    def strip_url_parameters(url):
        return url.partition("?")[0]


class FileVersionIntegrationTest(GenericVersionIntegrationTest, APITestCase, FileMixin):
    initial_download = None

    def get_asserter(self):
        return self

    def get_endpoint(self):
        return "files"

    def get_model_name(self):
        return "file"

    def create_initial_model_instance(self):
        create_response = self.rest_create_file(
            self.token_su, [self.project1.pk, self.project_tmp.pk],
            "my file", "my description", "demo1.txt", pow(2, 20),
            **http_info)
        self.assertEquals(create_response.status_code, HTTP_201_CREATED, "Couldn't create file")

        pk = get_json_content(create_response)['pk']
        file = File.objects.get(pk=pk)

        # store initially generated values
        response = self.load_model_from_api(file.pk)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't load file")
        initial_file = get_json_content(response)
        self.initial_download = initial_file['download']

        return file, create_response

    def modify_model_instance(self, model_pk):
        response = self.rest_update_file(
            self.token_su, model_pk, [self.project2.pk],
            "my new file title", "my new file description", "newfilename.txt", pow(2, 10),
            **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't update file")

        directory_pk = None
        response = self.rest_update_file_set_directory(
            self.token_su, model_pk, directory_pk, **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK, "Couldn't update file directory")

        self.modified_download = get_json_content(response)['download']

        return response

    def assert_database_still_has_modified_values_after_preview(self, actual):
        self.assertEquals("my new file title", actual['title'])
        self.assertEquals("my new file description", actual['description'])
        self.assertEquals(None, actual['directory_id'])
        # mime_type doesn't change
        self.assertEquals(pow(2, 10), actual['file_size'])
        # rest_update_file prefixes the filename with a random string -> check only the last part
        self.assertEquals("newfilename.txt", actual['name'][-15:])
        self.assertEquals(self.modified_download, actual['download'])

        expected_projects = {str(self.project2.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

        self.assert_download_file_name("newfilename.txt", actual)

    def load_model_from_api(self, pk):
        return self.rest_get_file(self.token_su, pk, **http_info)

    def assert_response_has_initial_values(self, initial, actual):
        self.assertEquals(initial.name, actual['name'])
        self.assertEquals(initial.description, actual['description'])
        self.assertEquals(initial.directory_id, actual['directory_id'])
        self.assertEquals(initial.mime_type, actual['mime_type'])
        self.assertEquals(initial.file_size, actual['file_size'])
        self.assertEquals(self.initial_download, actual['download'])

        expected_projects = {str(self.project1.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

        self.assert_download_file_name(initial.name, actual)

    def assert_download_file_name(self, expected, actual_response_data):
        response = self.client.get(actual_response_data['download'])
        actual_file_name_end = response.get('Content-Disposition')[-len(expected) - 1:-1]
        self.assertEquals(expected, actual_file_name_end)


class LabBookVersionIntegrationTest(GenericVersionIntegrationTest, APITestCase,
                                    LabBookMixin, NoteMixin, PictureMixin, FileMixin):
    picture1 = None
    picture1_element_pk = None

    picture2 = None
    picture2_element_pk = None

    file1 = None
    file1_element_pk = None

    file2 = None
    file2_element_pk = None

    note1 = None
    note1_element_pk = None

    note2 = None
    note2_element_pk = None

    tmp_note = None

    initial_lab_book = None

    def get_asserter(self):
        return self

    def get_endpoint(self):
        return "labbooks"

    def get_model_name(self):
        return "labbook"

    def create_initial_model_instance(self):
        projects = [self.project1.pk, self.project_tmp.pk]

        lab_book, create_response = self.create_labbook_orm(
            self.token_su, projects, "my lab book", False,
            **http_info)
        self.assertEquals(create_response.status_code, HTTP_201_CREATED, "Couldn't create lab book")

        # create for each element type:
        #   one without pre-existing versions
        #   one with pre-existing versions
        #
        # entities: picture, file, comment

        # --- pictures ---
        picture_content_type_id = Picture.get_content_type().id
        self.picture1, response = self.create_picture_orm(
            self.token_su, projects, "my first picture", "demo1.png", **http_info)
        self.assertEquals(response.status_code, HTTP_201_CREATED)
        self.picture1_element_pk = self.add_element_to_labbook(
            lab_book, picture_content_type_id, self.picture1.pk, 0, 0)
        self.allow_model_access("pictures", "picture", self.picture1.pk, self.user1)

        # unlock the picture
        response = self.unlock(self.token_su, "pictures", self.picture1.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        self.picture2, response = self.create_picture_orm(
            self.token_su, projects, "my second picture", "demo1.png", **http_info)
        self.assertEquals(response.status_code, HTTP_201_CREATED)
        self.create_version("pictures", self.picture2.pk)
        self.picture2_element_pk = self.add_element_to_labbook(
            lab_book, picture_content_type_id, self.picture2.pk, 0, 100)
        self.allow_model_access("pictures", "picture", self.picture2.pk, self.user1)

        # unlock the picture
        response = self.unlock(self.token_su, "pictures", self.picture2.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        # --- files ---
        file_content_type_id = File.get_content_type().id
        self.file1, response = self.create_file_orm(
            self.token_su, projects, "my first file", "my first file desc", "file1.txt", 512,
            **http_info)
        self.assertEquals(response.status_code, HTTP_201_CREATED)
        self.file1_element_pk = self.add_element_to_labbook(lab_book, file_content_type_id, self.file1.pk, 0, 200)
        self.allow_model_access("files", "file", self.file1.pk, self.user1)

        # unlock the file
        response = self.unlock(self.token_su, "files", self.file1.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        self.file2, response = self.create_file_orm(
            self.token_su, projects, "my second file", "my second file desc", "file2.txt", 1024,
            **http_info)
        self.assertEquals(response.status_code, HTTP_201_CREATED)
        self.create_version("files", self.file2.pk)
        self.file2_element_pk = self.add_element_to_labbook(lab_book, file_content_type_id, self.file2.pk, 0, 300)
        self.allow_model_access("files", "file", self.file2.pk, self.user1)

        # unlock the file
        response = self.unlock(self.token_su, "files", self.file2.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        # --- notes ---
        note_content_type_id = Note.get_content_type().id
        self.note1, response = self.create_note_orm(
            self.token_su, projects, "my first note", "my first note content",
            **http_info)
        self.assertEquals(response.status_code, HTTP_201_CREATED)
        self.note1_element_pk = self.add_element_to_labbook(lab_book, note_content_type_id, self.note1.pk, 0, 400)
        self.allow_model_access("notes", "note", self.note1.pk, self.user1)

        # unlock the note
        response = self.unlock(self.token_su, "notes", self.note1.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        self.note2, response = self.create_note_orm(
            self.token_su, projects, "my second note", "my second note content",
            **http_info)
        self.assertEquals(response.status_code, HTTP_201_CREATED)
        self.create_version("notes", self.note2.pk)
        self.note2_element_pk = self.add_element_to_labbook(lab_book, note_content_type_id, self.note2.pk, 0, 500)
        self.allow_model_access("notes", "note", self.note2.pk, self.user1)

        self.initial_lab_book = lab_book

        # unlock the note
        response = self.unlock(self.token_su, "notes", self.note2.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        return lab_book, create_response

    def unlock_model(self, token, pk):
        """ Overwrite the unlock method so we can unlock all the sub-elements """
        if not token:
            token = self.token_su

        # unlock the labbook
        response = self.unlock(token, self.get_endpoint(), pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        # unlock all other elements by directly removing the element lock

        with disable_permission_checks(ElementLock):
            ElementLock.objects.all().delete()

        return response

    def add_element_to_labbook(self, lab_book, element_content_type_id, element_id, x, y):
        response = self.rest_add_labbook_element(
            self.token_su, lab_book.pk, element_content_type_id, element_id, x, y, 100, 100,
            **http_info)
        self.assertEquals(response.status_code, HTTP_201_CREATED, "Couldn't add element to LabBook")
        return get_json_content(response)['pk']

    def modify_model_instance(self, model_pk):
        projects = [self.project2.pk]

        update_response = self.rest_update_labbook(self.token_su, model_pk, projects, "modified title", True,
                                                   **http_info)
        self.assertEquals(update_response.status_code, HTTP_200_OK)

        # --- pictures ---
        response = self.rest_update_picture(
            self.token_su, self.picture1.pk, projects,
            "modified pic title", "demo2.png",
            **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK)

        # unlock the picture
        response = self.unlock(self.token_su, "pictures", self.picture1.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        response = self.rest_update_picture(
            self.token_su, self.picture2.pk, projects,
            "modified pic2 title", "demo2.png",
            **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK)

        # unlock the picture
        response = self.unlock(self.token_su, "pictures", self.picture2.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        # --- files ---
        response = self.rest_update_file(
            self.token_su, self.file1.pk, projects,
            "modified file1 title", "mod file1 desc", "modfile1.txt", pow(2, 22),
            **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK)

        # unlock the file
        response = self.unlock(self.token_su, "files", self.file1.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        response = self.rest_update_file(
            self.token_su, self.file2.pk, projects,
            "modified file2 title", "mod file2 desc", "modfile2.txt", pow(2, 23),
            **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK)

        # unlock the file
        response = self.unlock(self.token_su, "files", self.file2.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        # --- notes ---
        response = self.rest_update_note(
            self.token_su, self.note1.pk, projects,
            "mod note1 subject", "mod note1 content",
            **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK)

        # unlock the note
        response = self.unlock(self.token_su, "notes", self.note1.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        response = self.rest_update_note(
            self.token_su, self.note2.pk, projects,
            "mod note2 subject", "mod note2 content",
            **http_info)
        self.assertEquals(response.status_code, HTTP_200_OK)

        # unlock the note
        response = self.unlock(self.token_su, "notes", self.note2.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        # remove an element
        response = self.rest_remove_labbook_element(self.token_su, model_pk, self.picture1_element_pk, **http_info)
        self.assertEquals(response.status_code, HTTP_204_NO_CONTENT, response.content.decode())

        # add an element
        note_content_type_id = Note.get_content_type().id
        self.tmp_note, response = self.create_note_orm(
            self.token_su, projects,
            "my tmp note", "my tmp note content",
            **http_info)
        self.assertEquals(response.status_code, HTTP_201_CREATED)
        self.note1_element_pk = self.add_element_to_labbook(
            self.initial_lab_book, note_content_type_id, self.tmp_note.pk, 42, 999)
        self.allow_model_access("notes", "note", self.tmp_note.pk, self.user1)

        # unlock the note
        response = self.unlock(self.token_su, "notes", self.tmp_note.pk, HTTP_USER_AGENT, REMOTE_ADDRESS)

        return update_response

    def assert_database_still_has_modified_values_after_preview(self, actual):
        # check LabBook itself
        self.assertEquals("modified title", actual['title'])
        # description is not updated by rest_update_labbook
        # self.assertEquals("modified description", actual['description'])
        self.assertEquals(True, actual['is_template'])

        expected_projects = {str(self.project2.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

        # check LabBook elements
        response = self.rest_get_labbook_elements(self.token_su, self.initial_lab_book.pk, **http_info)
        actual_elements = get_json_content(response)
        for actual_element in actual_elements:
            object_id = actual_element['child_object_id']
            # picture 1 deleted
            if object_id == str(self.picture2.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 100)
            elif object_id == str(self.file1.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 200)
            elif object_id == str(self.file2.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 300)
            elif object_id == str(self.note1.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 400)
            elif object_id == str(self.note2.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 500)
            # tmp_note added
            elif object_id == str(self.tmp_note.pk):
                self.assertEquals(actual_element['position_x'], 42)
                self.assertEquals(actual_element['position_y'], 999)
            else:
                self.fail("Unexpected element")

        # check element objects
        response = self.rest_get_picture(self.token_su, self.picture1.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['title'], "modified pic title")

        response = self.rest_get_picture(self.token_su, self.picture2.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['title'], "modified pic2 title")

        response = self.rest_get_file(self.token_su, self.file1.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['title'], "modified file1 title")

        response = self.rest_get_file(self.token_su, self.file2.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['title'], "modified file2 title")

        response = self.rest_get_note(self.token_su, self.note1.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['subject'], "mod note1 subject")

        response = self.rest_get_note(self.token_su, self.note2.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['subject'], "mod note2 subject")

        # child element version numbers stay the same, since there is no new version of the LabBook
        # -> no need to check that

    def load_model_from_api(self, pk):
        return self.rest_get_labbook(self.token_su, pk, **http_info)

    def assert_response_has_initial_values(self, initial, actual):
        # check LabBook itself
        self.assertEquals(initial.title, actual['title'])
        self.assertEquals(initial.description, actual['description'])
        self.assertEquals(initial.is_template, actual['is_template'])

        expected_projects = {str(self.project1.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

        # sub-elements are not in response -> check them for the database only

    def assert_database_has_initial_values(self, initial, actual):
        # check LabBook itself
        self.assertEquals(initial.title, actual['title'])
        self.assertEquals(initial.description, actual['description'])
        self.assertEquals(initial.is_template, actual['is_template'])

        expected_projects = {str(self.project1.pk)}
        actual_projects = set(actual['projects'])
        self.assertSetEqual(expected_projects, actual_projects)

        self.assert_initial_labbook_elements(initial.pk)

        # check element objects
        response = self.rest_get_picture(self.token_su, self.picture1.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['title'], self.picture1.title)

        response = self.rest_get_picture(self.token_su, self.picture2.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['title'], self.picture2.title)

        response = self.rest_get_file(self.token_su, self.file1.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['title'], "my first file")

        response = self.rest_get_file(self.token_su, self.file2.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['title'], "my second file")

        response = self.rest_get_note(self.token_su, self.note1.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['subject'], self.note1.subject)

        response = self.rest_get_note(self.token_su, self.note2.pk, **http_info)
        json = get_json_content(response)
        self.assertEquals(json['subject'], self.note2.subject)

    def assert_initial_labbook_elements(self, model_pk):
        response = self.rest_get_labbook_elements(self.token_su, model_pk, **http_info)
        actual_elements = get_json_content(response)
        for actual_element in actual_elements:
            object_id = actual_element['child_object_id']
            if object_id == str(self.picture1.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 0)
            elif object_id == str(self.picture2.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 100)
            elif object_id == str(self.file1.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 200)
            elif object_id == str(self.file2.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 300)
            elif object_id == str(self.note1.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 400)
            elif object_id == str(self.note2.pk):
                self.assertEquals(actual_element['position_x'], 0)
                self.assertEquals(actual_element['position_y'], 500)
            else:
                self.fail("Unexpected element: %s" % actual_element['child_object'])

    def assert_values_of_restore_response(self, initial_model, json):
        def normalize_child_from_json(child):
            return child['display_name'] + '___' + str(child.version)

        def normalize_child_from_model(model, version):
            return str(model) + '___' + str(version)

        # check the child element versions
        self.assertTrue('child_elements' in json)
        actual_child_elements = set([normalize_child_from_json(c) for c in json['child_elements']])
        expected_child_elements = {
            normalize_child_from_model(self.picture1, 1),
            normalize_child_from_model(self.picture2, 2),
            normalize_child_from_model(self.file1, 1),
            normalize_child_from_model(self.file2, 2),
            normalize_child_from_model(self.note1, 1),
            normalize_child_from_model(self.note2, 2),
        }
        self.assertSetEqual(actual_child_elements, expected_child_elements)

        # check the "normal" values too
        self.assert_response_has_initial_values(initial_model, json)


class DmpVersionIntegrationTest(GenericVersionIntegrationTest, APITestCase, DmpsMixin):
    def get_asserter(self):
        return self

    def get_endpoint(self):
        return "dmps"

    def get_model_name(self):
        return "dmp"

    def create_initial_model_instance(self):
        dmp_form = DmpForm.objects.create(title="My DMP Form", description="My DMP Form Description")
        self.dmp_form_pk = dmp_form.pk

        self.dmp_form_field1 = DmpFormField.objects.create(
            name="My DMP Form Field 1", type=DmpFormField.TEXTAREA, infotext="My form textarea", dmp_form=dmp_form)

        self.dmp_form_field2 = DmpFormField.objects.create(
            name="My DMP Form Field 2", type=DmpFormField.NUMBER, infotext="My form number", dmp_form=dmp_form)

        self.initial = {
            'projects': [self.project1.pk, self.project_tmp.pk],
            'title': "My DMP",
            'status': Dmp.PROGRESS,
            'data1': "My dmp form data value",
            'data2': "232323",
        }

        dmp, create_response = self.create_dmp_orm(
            self.token_su, self.initial['projects'],
            self.initial['title'], self.initial['status'], dmp_form.pk,
            **http_info)

        self.dmp_pk = dmp.pk

        response = self.rest_get_dmp(self.dmp_pk, **http_info)
        dmp_form_data = get_json_content(response)['dmp_form_data']
        self.data1_pk = dmp_form_data[0]['pk']
        self.data2_pk = dmp_form_data[1]['pk']

        self.update_dmp_form_data(self.dmp_pk, [
            {'pk': str(self.data1_pk), 'value': self.initial['data1']},
            {'pk': str(self.data2_pk), 'value': self.initial['data2']}
        ], **http_info)

        return dmp, create_response

    def modify_model_instance(self, model_pk):
        self.modified = {
            'projects': [self.project2.pk],
            'title': "My modified DMP",
            'status': Dmp.FINAL,
            'data1': "My modified dmp value 1",
            'data2': "567",
        }

        update_response = self.update_dmp(
            self.token_su,
            self.modified['projects'], self.modified['title'], self.modified['status'],
            self.dmp_pk, self.dmp_form_pk,
            **http_info
        )

        response = self.update_dmp_form_data(
            self.dmp_pk, [
                {'pk': str(self.data1_pk), 'value': self.modified['data1']},
                {'pk': str(self.data2_pk), 'value': self.modified['data2']},
            ],
            **http_info
        )
        self.assertEquals(response.status_code, HTTP_200_OK, response.content.decode())

        return update_response

    def assert_database_still_has_modified_values_after_preview(self, actual):
        expected = copy.deepcopy(self.modified)
        expected['projects'] = [str(p) for p in expected['projects']]

        self.assert_expected_values(expected, actual)

    def load_model_from_api(self, pk):
        return self.rest_get_dmp(self.dmp_pk, **http_info)

    def assert_response_has_initial_values(self, initial, actual):
        expected = copy.deepcopy(self.initial)
        expected['projects'].remove(self.project_tmp.pk)
        expected['projects'] = [str(p) for p in expected['projects']]

        self.assert_expected_values(expected, actual)

    def assert_expected_values(self, expected, actual):
        self.assertEquals(expected['title'], actual['title'])
        self.assertEquals(expected['status'], actual['status'])

        self.assertSetEqual(set(expected['projects']), set(actual['projects']))

        self.assertEquals(2, len(actual['dmp_form_data']))
        self.assertEquals(actual['dmp_form_data'][0]['value'], expected['data1'])
        self.assertEquals(actual['dmp_form_data'][1]['value'], expected['data2'])
