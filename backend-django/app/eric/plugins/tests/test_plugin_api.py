#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core import mail
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import REMOTE_ADDR, HTTP_USER_AGENT
from eric.core.tests.test_utils import CommonTestMixin
from eric.plugins.models import Plugin
from eric.plugins.tests.mixins import PluginMixin, PLUGIN_BASE_URL


class TestPluginAPI(APITestCase, PluginMixin, CommonTestMixin):
    """ Tests the basic plugin API """

    @classmethod
    def setUpTestData(cls):
        cls.plugin1 = Plugin.objects.create(
            title='My First Plugin',
            short_description='This is a test plugin.',
            long_description='',
            user_availability=Plugin.GLOBAL,
            path='test_plugin_path',
        )

    def setUp(self):
        self.superuser, self.superuser_token = self.create_user_and_log_in(username='superuser', is_superuser=True)

    def test_get_returns_plugins(self):
        response = self.rest_get_plugin_list(self.superuser_token)
        data = self.parse_response(response, expected_status_code=status.HTTP_200_OK)
        self.assertEqual(len(data), 1, 'There should be exactly one plugin')

    def test_there_is_no_put_api(self):
        response = self.client.put(
            PLUGIN_BASE_URL + '{}/'.format(self.plugin1.pk),
            {
                'pk': self.plugin1.pk,
                'title': 'My Plugin - CHANGED',
                'short_description': 'This is a test plugin. - CHANGED',
                'long_description': 'Well, hello there! This is a test plugin. - CHANGED',
                'path': 'some-test-path-that-does-not-exist-CHANGED',
                'user_availabililty': Plugin.GLOBAL,
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, 'There should be not PUT API')

        self.assertEqual(Plugin.objects.count(), 1, 'There should be the initial plugin only')
        plugin = Plugin.objects.get(pk=self.plugin1.pk)
        self.assertEqual(plugin.title, 'My First Plugin')

    def test_there_is_no_patch_api(self):
        response = self.client.patch(
            PLUGIN_BASE_URL + '{}/'.format(self.plugin1.pk),
            {
                'pk': self.plugin1.pk,
                'title': 'My Plugin - CHANGED',
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, 'There should be no PATCH API')

        self.assertEqual(Plugin.objects.count(), 1, 'There should be the initial plugin only')
        plugin = Plugin.objects.get(pk=self.plugin1.pk)
        self.assertEqual(plugin.title, 'My First Plugin')

    def test_there_is_no_delete_api(self):
        response = self.client.delete(
            PLUGIN_BASE_URL + '{}/'.format(self.plugin1.pk),
            {
                'pk': self.plugin1.pk,
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, 'There should be no DELETE API')
        self.assertEqual(Plugin.objects.count(), 1, 'The initial plugin should still exist')


class TestPluginFeedbackAndRequestAccessAPI(APITestCase, PluginMixin, CommonTestMixin):
    """ Tests the feedback and request access functionality """

    @classmethod
    def setUpTestData(cls):
        cls.plugin1 = Plugin.objects.create(
            title='My First Plugin',
            short_description='This is a test plugin.',
            long_description='',
            user_availability=Plugin.GLOBAL,
            path='test_plugin_path',
        )

        # contact admin setting for patching
        cls.contact_admin1_mail = 'admin1@workbench.test'
        cls.contact_admin2_mail = 'admin1@workbench.test'
        cls.contact_admin = (
            ('Workbench Admin 1', cls.contact_admin1_mail),
            ('Workbench Admin 2', cls.contact_admin2_mail),
        )

        # create responsible users
        cls.responsible_user1 = cls.create_user(username='responsible1', email='responsible1@test.local')
        cls.responsible_user2 = cls.create_user(username='responsible2', email='responsible2@test.local')
        cls.plugin1.responsible_users.add(cls.responsible_user1)
        cls.plugin1.responsible_users.add(cls.responsible_user2)

    def setUp(self):
        self.user1, self.token1 = self.create_user_and_log_in(username='user1', groups=['User'])

    def test_feedback_sends_mail_to_responsible_users_and_admins(self):
        # patch Django settings
        with self.settings(CONTACT_ADMIN=self.contact_admin):
            # send feedback via API
            response = self.rest_send_plugin_generic_feedback(
                self.token1, plugin_pk=self.plugin1.pk,
                subject='Some Feedback',
                message='This is a nice plugin :-)',
                feedback_type='feedback'
            )
            self.assert_response_status(response, status.HTTP_200_OK)

        # check recipients
        self.assert_mail_is_sent_to_contact_admins_and_responsible_users()

        # check contents
        mail1 = mail.outbox[0]
        mail_content = mail1.body
        mail_subject = mail1.subject
        self.assertTrue('Some Feedback' in mail_subject)
        self.assertTrue('This is a nice plugin :-)' in mail_content)

    def test_request_access_sends_mail_to_responsible_users_and_admins(self):
        # patch Django settings
        with self.settings(CONTACT_ADMIN=self.contact_admin):
            # request access via API
            response = self.rest_send_plugin_generic_feedback(
                self.token1, plugin_pk=self.plugin1.pk,
                subject='Request to access plugin',
                message='Hi, I need access to this plugin. Please grant me access.',
                feedback_type='request_access'
            )
            self.assert_response_status(response, status.HTTP_200_OK)

        # check recipients
        self.assert_mail_is_sent_to_contact_admins_and_responsible_users()

        # check contents
        mail1 = mail.outbox[0]
        mail_content = mail1.body
        self.assertTrue('Hi, I need access to this plugin. Please grant me access.' in mail_content)

    def assert_mail_is_sent_to_contact_admins_and_responsible_users(self):
        recipients = [m.to[0] for m in mail.outbox]
        expected_recipients = [
            self.contact_admin1_mail,
            self.contact_admin2_mail,
            self.responsible_user1.email,
            self.responsible_user2.email,
        ]
        self.assertEqual(len(recipients), len(expected_recipients))
        self.assertEqual(set(recipients), set(expected_recipients))
