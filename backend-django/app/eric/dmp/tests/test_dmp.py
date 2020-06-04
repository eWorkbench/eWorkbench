#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.contrib.auth.models import Group, Permission
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from eric.projects.models import Role, Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin
from eric.dmp.tests.core import DmpsMixin
from eric.dmp.models import DmpForm, DmpFormField, Dmp, DmpFormData

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class DmpsTest(APITestCase, AuthenticationMixin, ProjectsMixin, DmpsMixin):
    """ Extensive testing of dmp endpoint """

    def setUp(self):
        """ set up a user, a dmp form and dmp form fields"""

        # get user group
        self.user_group = Group.objects.get(name='User')

        # create 2 users and assign them to the user group
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        # get add_file and add_file_without_project permission
        self.add_dmp_permission = Permission.objects.filter(
            codename='add_dmp',
            content_type=Dmp.get_content_type()
        ).first()

        self.add_dmp_without_project_permission = Permission.objects.filter(
            codename='add_dmp_without_project',
            content_type=Dmp.get_content_type()
        ).first()

        # create 2 dmp forms
        self.dmp_form1 = self.validate_create_dmp_forms("dmpform1", "unittest dmpform1")
        self.dmp_form2 = self.validate_create_dmp_forms("dmpform2", "unittest dmpform2")

        # create 2 dmp form field which are associated to dmp_form1
        self.dmp_form_field1 = self.validate_create_dmp_form_field("dmpformfield1", "NUM", "unittest dmpformfield1",
                                                                   self.dmp_form1)
        self.dmp_form_field2 = self.validate_create_dmp_form_field("dmpformfield2", "TXA", "unittest dmpformfield2",
                                                                   self.dmp_form1)

        # create 3 dmp form field which are associated to dmp_form2
        self.dmp_form_field3 = self.validate_create_dmp_form_field("dmpformfield3", "TXF", "unittest dmpformfield3",
                                                                   self.dmp_form2)
        self.dmp_form_field4 = self.validate_create_dmp_form_field("dmpformfield4", "TXA", "unittest dmpformfield4",
                                                                   self.dmp_form2)
        self.dmp_form_field5 = self.validate_create_dmp_form_field("dmpformfield5", "TXA", "unittest dmpformfield5",
                                                                   self.dmp_form2)

        self.token1 = self.login_and_return_token('student_1', 'top_secret', HTTP_USER_AGENT, REMOTE_ADDR)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)

        # create a new project
        self.project = self.create_project(self.token1, "DMP Project", "Unittest DMP Project", Project.INITIALIZED,
                                           HTTP_USER_AGENT, REMOTE_ADDR)

        # get project manager role
        self.projectManagerRole = Role.objects.filter(default_role_on_project_create=True).first()

    def validate_create_dmp_forms(self, title, description):
        """
        create a new dmp form
        check if the dmp form was created
        check if the saved title and description are correct
        """
        # store the dmp form length
        initial_dmp_form_length = len(DmpForm.objects.all())

        # create the dmp form object
        dmp_form = DmpForm.objects.create(title=title, description=description)

        # check if the dmp form object was created
        self.assertEqual(len(DmpForm.objects.all()), initial_dmp_form_length+1, msg="check if the dmp form was created")
        # check if the correct data are saved
        self.assertEqual(dmp_form.title, title, msg="check if correct title was saved")
        self.assertEqual(dmp_form.description, description, msg="check if correct description was saved")

        return dmp_form

    def validate_create_dmp_form_field(self, name, type, infotext, form_field):
        """
        create a new dmp form field
        check if the dmp form field was created

        """
        # store the dmp form field length
        initial_dmp_form_field_length = len(DmpFormField.objects.all())

        # create the dmp form field object
        dmp_form_field = DmpFormField.objects.create(name=name, type=type,
                                                     infotext=infotext, dmp_form=form_field)

        # check if the dmp form field object was created
        self.assertEqual(len(DmpFormField.objects.all()), initial_dmp_form_field_length+1,
                         msg="check if the dmp form field was created")
        # check if the correct data are saved
        self.assertEqual(dmp_form_field.name, name, msg="check if correct title was saved")
        self.assertEqual(dmp_form_field.type, type, msg="check if correct type was saved")
        self.assertEqual(dmp_form_field.infotext, infotext, msg="check if correct infotext was saved")
        self.assertEqual(dmp_form_field.dmp_form, form_field, msg="check if correct dmp_form was saved")

        return dmp_form_field

    def test_create_dmp(self):
        """ tries to create a DMP """

        # create a new dmp which is associated to dmp form 1
        dmp = self.create_dmp(self.token1, self.project.pk, "First DMP", Dmp.NEW, self.dmp_form1.pk,
                              HTTP_USER_AGENT, REMOTE_ADDR)
        # verify that a dmp was saved in the database
        self.assertEquals(Dmp.objects.all().count(), 1)
        self.assertEquals(dmp.title, "First DMP")
        self.assertEquals(dmp.status, Dmp.NEW)

        # verify that two DMP Form Data related to the dmp were created
        self.assertEquals(DmpFormData.objects.filter(dmp=dmp).count(), 2)

        # create another dmp (dmp form 2)
        dmp2 = self.create_dmp(self.token1, self.project.pk, "Second DMP", Dmp.NEW, self.dmp_form2.pk,
                               HTTP_USER_AGENT, REMOTE_ADDR)
        # verify that a dmp was saved in the database
        self.assertEquals(Dmp.objects.all().count(), 2)
        self.assertEquals(dmp2.title, "Second DMP")
        self.assertEquals(dmp2.status, Dmp.NEW)

        # verify that three DMP Form Data related to the dmp were created
        self.assertEquals(DmpFormData.objects.filter(dmp=dmp2).count(), 3)

        # verify that there is a total of 5 dmp form data
        self.assertEquals(DmpFormData.objects.all().count(), 5)

    def test_create_dmp_without_project(self):
        """ tries to create a DMP without project """

        response = self.rest_create_dmp(self.token1, None, "First DMP", Dmp.NEW, self.dmp_form1.pk,
                                        HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # user needs permission
        self.user1.user_permissions.add(self.add_dmp_without_project_permission)

        # create a new dmp which is associated to dmp form 1
        dmp = self.create_dmp(self.token1, None, "First DMP", Dmp.NEW, self.dmp_form1.pk,
                              HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(dmp.title, "First DMP")
        self.assertEquals(dmp.status, Dmp.NEW)

        self.assertEquals(Dmp.objects.all().count(), 2)

    def test_create_dmp_with_wrong_parameter(self):
        """ Tries to create a dmp with wrong parameters """

        # do not send a dmp title
        response = self.client.post(
            '/api/dmps/',
            {
                'status': Dmp.NEW,
                'dmp_form': self.dmp_form1.pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"title":["This field is required."]}')

        # send an empty dmp title
        response = self.client.post(
            '/api/dmps/',
            {
                'title': '',
                'status': Dmp.NEW,
                'dmp_form': self.dmp_form1.pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"title":["This field may not be blank."]}')

        # do not send a dmp status (allowed, default value should be NEW)
        response = self.client.post(
            '/api/dmps/',
            {
                'title': 'new dmp',
                'dmp_form': self.dmp_form1.pk,
                'projects': [self.project.pk]
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded['status'], Dmp.NEW)

        # send an empty dmp status (allowed, default value should be NEW)
        response = self.client.post(
            '/api/dmps/',
            {
                'title': 'new dmp',
                'status': '',
                'dmp_form': self.dmp_form1.pk,
                'projects': [self.project.pk]
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded['status'], Dmp.NEW)

        # do not send a dmp form id
        response = self.client.post(
            '/api/dmps/',
            {
                'title': 'new dmp',
                'status': Dmp.NEW,
                'projects': [self.project.pk]
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"dmp_form":["This field is required."]}')

        # send an empty dmp form id
        response = self.client.post(
            '/api/dmps/',
            {
                'title': 'new dmp',
                'status': Dmp.NEW,
                'dmp_form': '',
                'projects': [self.project.pk]
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"dmp_form":["This field may not be null."]}')

    def test_update_dmp_and_nested_dmp_form_data(self):
        """ tries to update a dmp with their nested dmp form data and checks if values were updated """

        # create a new dmp
        dmp_object = self.create_dmp(self.token1, self.project.pk, "New DMP", Dmp.NEW, self.dmp_form1.pk,
                                     HTTP_USER_AGENT, REMOTE_ADDR)
        # get a dmp form data object for the specific dmp object
        dmp_form_data_object = DmpFormData.objects.filter(dmp=dmp_object.pk).first()

        data = {
            'title': 'update dmp',
            'status': Dmp.PROGRESS,
            'dmp_form': str(self.dmp_form1.pk),
            'dmp_form_data': [
                {
                    'pk': str(dmp_form_data_object.pk),
                    'value': '12345'
                }
            ]
        }

        response = self.client.put(
            '/api/dmps/{}/'.format(dmp_object.pk),
            json.dumps(data),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        # decode response and load it into json
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check if the dmp title and status have been changed
        self.assertNotEqual(decoded_response['title'], 'New DMP', msg="check if the title has not the old value")
        self.assertNotEqual(decoded_response['status'], Dmp.NEW, msg="check if the status has not the old value")

        # check if the dmp title and status have been updated correctly
        self.assertEqual(decoded_response['title'], 'update dmp', msg="check if the title was updated")
        self.assertEqual(decoded_response['status'], Dmp.PROGRESS, msg="check if the status was updated")

        # check if the dmp form data value has been updated correctly
        self.assertEqual(decoded_response['dmp_form_data'][0]['value'], '12345',
                         msg="check if the value from the first dmp form data was updated")

    def test_update_dmp_with_wrong_parameter(self):
        """ tries to update a dmp with wrong parameter """

        # create a new dmp with dmp form 1
        dmp_object = self.create_dmp(self.token1, self.project.pk, "Update DMP", Dmp.NEW, self.dmp_form1.pk,
                                     HTTP_USER_AGENT, REMOTE_ADDR)
        # get first dmp form data object for the specific dmp object
        dmp_form_data_object = DmpFormData.objects.filter(dmp=dmp_object.pk).first()

        # create a new dmp with dmp form 2
        dmp_object_2 = self.create_dmp(self.token1, self.project.pk, "Update DMP 2", Dmp.NEW, self.dmp_form2.pk,
                                       HTTP_USER_AGENT, REMOTE_ADDR)
        # get first dmp form data object for the specific dmp object
        second_dmp_form_data_objects = DmpFormData.objects.filter(dmp=dmp_object_2.pk)
        second_dmp_form_data_object = second_dmp_form_data_objects[1]

        # do not send a title
        response = self.client.put(
            '/api/dmps/{}/'.format(dmp_object.pk),
            {
                'status': Dmp.PROGRESS,
                'dmp_form': self.dmp_form1.pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"title":["This field is required."]}')

        # send an empty title
        response = self.update_dmp(self.token1, self.project.pk, "", Dmp.PROGRESS, dmp_object.pk,
                                   self.dmp_form1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"title":["This field may not be blank."]}')

        # do not send a status (allowed, default value should be NEW)
        response = self.client.put(
            '/api/dmps/{}/'.format(dmp_object.pk),
            {
                'title': 'update dmp',
                'dmp_form': self.dmp_form1.pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded['status'], Dmp.NEW)

        # send an empty status (allowed, default value should be NEW)
        response = self.update_dmp(self.token1, self.project.pk, "update dmp", "", dmp_object.pk,
                                   self.dmp_form1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded['status'], Dmp.NEW)

        # do not send a dmp form
        response = self.client.put(
            '/api/dmps/{}/'.format(dmp_object.pk),
            {
                'title': 'new dmp',
                'status': Dmp.NEW
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"dmp_form":["This field is required."]}')

        # send an empty dmp form
        response = self.update_dmp(self.token1, self.project.pk, "update dmp", Dmp.PROGRESS, dmp_object.pk,
                                   "", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"dmp_form":["This field may not be null."]}')

        # send a wrong dmp form
        response = self.update_dmp(self.token1, self.project.pk, "update dmp", Dmp.PROGRESS, dmp_object.pk,
                                   self.dmp_form2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"dmp_form":["You are not allowed to change the dmp form"]}')

        # send an empty project pk (allowed, project pk is in the URL)
        response = self.update_dmp(self.token1, self.project.pk, "update dmp", Dmp.PROGRESS, dmp_object.pk,
                                   self.dmp_form1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(decoded_response['projects'][0], str(self.project.pk), msg="check if the project pk was not updated")

        # do not send a dmp form data pk
        data = {
            'title': 'update dmp',
            'status': Dmp.PROGRESS,
            'dmp_form': str(self.dmp_form1.pk),
            'dmp_form_data': [
                {
                    'value': '12345'
                }
            ]
        }
        response = self.client.put(
            '/api/dmps/{}/'.format(dmp_object.pk),
            json.dumps(data),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"dmp_form_data":["Not all fields are provided"]}')

        # send an empty dmp form data pk
        response = self.update_dmp_and_nested_dmp_form_data(self.token1, self.project.pk, "update dmp",
                                                            Dmp.PROGRESS, dmp_object.pk,
                                                            self.dmp_form1.pk, '', '12345',
                                                            HTTP_USER_AGENT,
                                                            REMOTE_ADDR)
        # decode response and load it into json
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"dmp_form_data":["Not all fields are provided"]}')

        # send a wrong dmp form data pk
        response = self.update_dmp_and_nested_dmp_form_data(self.token1, self.project.pk, "update dmp",
                                                            Dmp.PROGRESS, dmp_object.pk,
                                                            self.dmp_form1.pk, second_dmp_form_data_object.pk, '12345',
                                                            HTTP_USER_AGENT,
                                                            REMOTE_ADDR)
        # decode response and load it into json
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.content.decode(), '{"detail":"Not found."}')

        # do not send a dmp form data value
        data = {
            'title': 'update dmp',
            'status': Dmp.PROGRESS,
            'dmp_form': str(self.dmp_form1.pk),
            'dmp_form_data': [
                {
                    'pk': str(dmp_form_data_object.pk)
                }
            ]
        }
        response = self.client.put(
            '/api/dmps/{}/'.format(dmp_object.pk),
            json.dumps(data),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        # decode response and load it into json
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"dmp_form_data":["Not all fields are provided"]}')

        # send a text value but type is specified for numbers
        response = self.update_dmp_and_nested_dmp_form_data(self.token1, self.project.pk, "update dmp", Dmp.PROGRESS,
                                                            dmp_object.pk, self.dmp_form1.pk, dmp_form_data_object.pk,
                                                            'my new value', HTTP_USER_AGENT, REMOTE_ADDR)
        # decode response and load it into json
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(),
                         '{"'+format(dmp_form_data_object.pk)+'":["The value has to be a number"]}')

        # send a text value, type is specified for text (allowed)
        response = self.update_dmp_and_nested_dmp_form_data(self.token1, self.project.pk, "update dmp", Dmp.PROGRESS,
                                                            dmp_object_2.pk, self.dmp_form2.pk,
                                                            second_dmp_form_data_object.pk, 'my new value',
                                                            HTTP_USER_AGENT, REMOTE_ADDR)
        # decode response and load it into json
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(decoded_response['dmp_form_data'][1]['value'], 'my new value',
                         msg="value should have been updated")

    def test_dmp_status_final_with_correct_user(self):
        """ tries to update a dmp when the status flag was set to final and the current user is the creator """

        # create a new dmp
        dmp_object = self.create_dmp(self.token1, self.project.pk, "New Final DMP", Dmp.FINAL, self.dmp_form1.pk,
                                     HTTP_USER_AGENT, REMOTE_ADDR)
        # get a dmp form data object for the specific dmp object
        dmp_form_data_object = DmpFormData.objects.filter(dmp=dmp_object.pk).first()

        # update the dmp
        response = self.update_dmp_and_nested_dmp_form_data(self.token1, self.project.pk, "Updated DMP", Dmp.FINAL, dmp_object.pk,
                                                            self.dmp_form1.pk, dmp_form_data_object.pk, '12345', HTTP_USER_AGENT, REMOTE_ADDR)

        # decode response and load it into json
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check if the dmp title and status have been updated correctly
        self.assertEqual(decoded_response['title'],'Updated DMP', msg="check if the title was updated")
        self.assertEqual(decoded_response['status'], Dmp.FINAL, msg="check if the status was updated")

        # check if the dmp form data value has been updated correctly
        self.assertEqual(decoded_response['dmp_form_data'][0]['value'], '12345',
                         msg="check if the value from the first dmp form data was updated")

        # check if the created user is the current user
        self.assertEqual(decoded_response['created_by']['username'], 'student_1', msg="current user is the dmp creator")

    def test_dmp_status_final_with_wrong_user(self):
        """ tries to update the dmp when the status is final and the current user is not the creator """

        # create a new dmp
        dmp_object = self.create_dmp(self.token1, self.project.pk, "New Final DMP", Dmp.FINAL, self.dmp_form1.pk,
                                     HTTP_USER_AGENT, REMOTE_ADDR)
        # get a dmp form data object for the specific dmp object
        dmp_form_data_object = DmpFormData.objects.filter(dmp=dmp_object.pk).first()

        # assign student 2 to the project of student 1 as project manager
        self.validate_assign_user_to_project(self.token1, self.project,
                                             self.user2, self.projectManagerRole, HTTP_USER_AGENT,
                                             REMOTE_ADDR)

        # login with user student 2
        self.token2 = self.login_and_return_token('student_2', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token2)

        # update dmp when status is final and the current user was not the creator
        response = self.update_dmp_and_nested_dmp_form_data(self.token2, self.project.pk, "Updated DMP with wrong user",
                                                            Dmp.FINAL,
                                                            dmp_object.pk,
                                                            self.dmp_form1.pk, dmp_form_data_object.pk, '111',
                                                            HTTP_USER_AGENT, REMOTE_ADDR)

        decoded_response = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('status' in decoded_response)
