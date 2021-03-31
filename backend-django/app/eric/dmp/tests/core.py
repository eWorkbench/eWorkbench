#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework import status
from rest_framework.status import HTTP_201_CREATED

from eric.core.tests import custom_json_handler
from eric.dmp.models import Dmp, DmpFormField, DmpFormData


class DmpsMixin:
    """A mixin that provides some helper methods for tests the DMP rest endpoint """

    def rest_get_dmp(self, dmp_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """ GETs a dmp """
        return self.client.get(
            path='/api/dmps/{}/'.format(dmp_id),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_dmps(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of dmps that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/dmps/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_create_dmp(self, auth_token, projects, dmp_title, dmp_status, dmp_form_id, HTTP_USER_AGENT,
                        REMOTE_ADDR):
        data = {
            'title': dmp_title,
            'status': dmp_status,
            'dmp_form': dmp_form_id
        }

        if projects:
            if not isinstance(projects, list):
                data['projects'] = [str(projects)]
            else:
                data['projects'] = projects

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        # Make a REST API call for creating a dmp
        response = self.client.post(
            '/api/dmps/',
            data,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        return response

    def create_dmp(self, auth_token, project_ids, dmp_title, dmp_status, dmp_form_id, HTTP_USER_AGENT,
                   REMOTE_ADDR):
        """
            tries to create a new dmp
            check if the dmp was created
            check if the associated dmp form data were created
        """

        # store the dmp form field length
        initial_dmp_length = Dmp.objects.all().count()

        response = self.rest_create_dmp(auth_token, project_ids, dmp_title, dmp_status, dmp_form_id,
                                        HTTP_USER_AGENT, REMOTE_ADDR)

        # dmp should have been created, HTTP response code should be 201
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        content = response.content.decode()
        decoded_response = json.loads(content)

        self.assertTrue('"pk":' in content, msg="primary key (pk) in response")
        self.assertTrue('"title":"' + dmp_title + '"' in content, msg="correct dmp title in response")
        self.assertTrue('"status":"' + dmp_status + '"' in content, msg="correct dmp status in response")
        self.assertTrue('"display":' in content, msg="Dmp display (str method) in response")
        self.assertTrue('"created_at":' in content, msg="created_at in response")
        self.assertTrue('"created_by":' in content, msg="created_by in response")

        # see what the actual Dmp element from database looks like
        pk = decoded_response['pk']
        dmp = Dmp.objects.get(pk=pk)

        # check if the dmp object was created
        self.assertEqual(Dmp.objects.all().count(), initial_dmp_length + 1,
                         msg="check if the dmp was created")

        # check if the correct dmp title and status were saved
        self.assertEqual(dmp.title, dmp_title, msg="check if correct dmp title was saved")
        self.assertEqual(dmp.status, dmp_status, msg="check if correct dmp status was saved")

        # check if the correct DMP Form reference was saved
        self.assertEqual(dmp.dmp_form.pk, dmp_form_id, msg="check if correct dmp form reference was saved")

        # get form fields of the DMP
        dmp_form_fields = DmpFormField.objects.filter(dmp_form=dmp_form_id)
        # get form data of the DMP
        dmp_form_data = DmpFormData.objects.filter(dmp=pk)

        # check if the correct count of dmp form data are created
        self.assertEqual(dmp_form_fields.count(), dmp_form_data.count())

        # check if the dmp form data values are correct
        for dmp_form_field in dmp_form_fields:
            # check that dmp form field is only available one time for this dmp
            self.assertEqual(dmp_form_data.filter(dmp_form_field=dmp_form_field).count(), 1)
            # get data
            data = dmp_form_data.filter(dmp_form_field=dmp_form_field).first()
            self.assertEqual(data.name, dmp_form_field.name,
                             msg="check if the dmp form data has the correct name")
            self.assertEqual(data.type, dmp_form_field.type,
                             msg="check if the dmp form data has the correct type")
            self.assertEqual(data.infotext, dmp_form_field.infotext,
                             msg="check if the dmp form data has the correct infotext")

        return dmp

    def create_dmp_orm(self,
                       auth_token, project_ids,
                       dmp_title, dmp_status, dmp_form_id,
                       HTTP_USER_AGENT, REMOTE_ADDR):

        response = self.rest_create_dmp(
            auth_token, project_ids,
            dmp_title, dmp_status, dmp_form_id,
            HTTP_USER_AGENT, REMOTE_ADDR)

        dmp = None
        content = response.content.decode()
        decoded_response = json.loads(content)

        if response.status_code == HTTP_201_CREATED:
            pk = decoded_response['pk']
            dmp = Dmp.objects.get(pk=pk)

        return dmp, response

    def update_dmp(self, auth_token, projects, dmp_title, dmp_status, dmp_id, dmp_form_id,
                   HTTP_USER_AGENT, REMOTE_ADDR):
        """
            tries to update a dmp
            :return response
        """

        data = {
            'title': dmp_title,
            'status': dmp_status,
            'dmp_form': dmp_form_id
        }

        if projects:
            if not isinstance(projects, list):
                data['projects'] = [str(projects)]
            else:
                data['projects'] = projects

        response = self.client.put(
            '/api/dmps/{}/'.format(dmp_id),
            data,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        return response

    def update_dmp_and_nested_dmp_form_data(self, auth_token, project_id, dmp_title, dmp_status, dmp_id, dmp_form_id,
                                            dmp_form_data_id, dmp_form_data_value, HTTP_USER_AGENT, REMOTE_ADDR):
        """
            tries to update a dmp and the nested dmp form data
            :return response
        """

        data = {
            'title': dmp_title,
            'status': dmp_status,
            'dmp_form': str(dmp_form_id),
            'dmp_form_data': [
                {
                    'pk': str(dmp_form_data_id),
                    'value': dmp_form_data_value
                }
            ]
        }

        if project_id:
            data['project'] = str(project_id)

        response = self.client.put(
            '/api/dmps/{}/'.format(dmp_id),
            json.dumps(data),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        return response

    def update_dmp_form_data(self, dmp_id, dmp_form_data_pk_and_value_list,
                             HTTP_USER_AGENT, REMOTE_ADDR):

        data = {
            'dmp_form_data': dmp_form_data_pk_and_value_list
        }

        response = self.client.patch(
            '/api/dmps/{}/'.format(dmp_id),
            json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        return response
