#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import unittest

import time_machine
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from django.utils import timezone
from django.utils.timezone import localtime
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.templatetags.date_filters import date_short
from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR, HTTP_INFO
from eric.core.tests.test_utils import CommonTestMixin, naive_dt, FakeRequest, FakeRequestUser
from eric.model_privileges.models import ModelPrivilege
from eric.notifications.models import Notification, NotificationConfiguration, ScheduledNotification
from eric.notifications.tests.core import NotificationMixIn
from eric.projects.models import Resource
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ResourceMixin
from eric.relations.tests.core import RelationsMixin
from eric.shared_elements.models import Task, CalendarAccess
from eric.shared_elements.tests.core import TaskMixin, MeetingMixin

User = get_user_model()


class NotificationsTest(APITestCase, AuthenticationMixin, UserMixin, TaskMixin, MeetingMixin,
                        NotificationMixIn, RelationsMixin):
    def setUp(self):
        """ Extensive testing of the notifications endpoint """
        # get user group
        self.user_group = Group.objects.get(name='User')

        # create 2 users and assign them to the user group
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        # login with student 1
        self.token1 = self.login_and_return_token('student_1', 'top_secret', HTTP_USER_AGENT, REMOTE_ADDR)

        # login with student 2
        self.token2 = self.login_and_return_token('student_2', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)

    def test_verify_auto_created_notification_configuration(self):
        """
        Test that the notification configuration has been automatically created for the two users
        :return:
        """
        self.assertEquals(NotificationConfiguration.objects.all().count(), 2,
                          msg="There are two automatically created notification configurations")

    def test_verify_no_notifications_available_by_default(self):
        """
        The notification list should be empty in the beginning
        :return:
        """
        self.assertEquals(Notification.objects.all().count(), 0)

    def test_creating_notifications_task(self):
        """
        Tests creating a new notification for a task
        :return:
        """
        # there should be zero notifications to begin with
        self.assertEquals(Notification.objects.all().count(), 0)

        # create a new task
        task, response = self.create_task_orm(
            self.token1, None, "Some Task", "With some description", Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL,
            timezone.now(), timezone.now(), [self.user1.pk, self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # unlock the task with user1
        response = self.unlock(self.token1, "tasks", task.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # creating a task as user1 should create two notifications for user2 (task has changed, you have been added)
        self.assertEquals(Notification.objects.all().count(), 2)

        # those two notifications have been created by user1 and are for user2
        self.assertEquals(Notification.objects.filter(user=self.user2, created_by=self.user1).count(), 2)
        self.assertEquals(
            Notification.objects.filter(
                notification_type=NotificationConfiguration.NOTIFICATION_CONF_TASK_USER_CHANGED).count(), 1)
        self.assertEquals(
            Notification.objects.filter(
                notification_type=NotificationConfiguration.NOTIFICATION_CONF_TASK_CHANGED).count(), 1)

        # now user2 changes the task
        response = self.rest_update_task(
            self.token2, str(task.pk), None, "Some Task !!!", "With some description",
            Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL,
            timezone.now(), timezone.now(), [self.user1.pk, self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # unlock task with user2
        response = self.unlock(self.token2, "tasks", task.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now an additional notification for user1 should have been created, totalling in 3 notifications
        self.assertEquals(Notification.objects.filter(user=self.user1, created_by=self.user2).count(), 1)
        self.assertEquals(Notification.objects.all().count(), 3)

        # remove user2 from task, this should trigger another notification
        response = self.rest_update_task_assigned_users(self.token1, str(task.pk), [self.user1.pk], HTTP_USER_AGENT,
                                                        REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # there should be 4 notifications
        self.assertEquals(Notification.objects.all().count(), 4)

        # and 3 of them for user2
        self.assertEquals(Notification.objects.filter(user=self.user2, created_by=self.user1).count(), 3)

    def test_creating_notifications_meeting(self):
        """ Tests creating a notification for a new meeting """

        # there should be zero notifications to begin with
        self.assertEquals(Notification.objects.all().count(), 0)

        # create a new task
        meeting, response = self.create_meeting_orm(
            self.token1, None, "Some Meeting", "With some description",
            timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # add user1 and user2 to meeting
        self.rest_update_meeting_attending_users(self.token1, str(meeting.pk), [self.user1.pk, self.user2.pk],
                                                 HTTP_USER_AGENT, REMOTE_ADDR)

        # creating a task as user1 should create two notifications for user2 (task has changed, you have been added)
        self.assertEquals(Notification.objects.all().count(), 2)

        # those two notifications have been created by user1 and are for user2
        self.assertEquals(Notification.objects.filter(user=self.user2, created_by=self.user1).count(), 2)
        self.assertEquals(
            Notification.objects.filter(
                notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_USER_CHANGED).count(), 1)
        self.assertEquals(
            Notification.objects.filter(
                notification_type=NotificationConfiguration.NOTIFICATION_CONF_MEETING_CHANGED).count(), 1)

        # remove user2 from task, this should trigger another notification
        response = self.rest_update_meeting_attending_users(self.token1, str(meeting.pk), [self.user1.pk],
                                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # there should be 3 notifications
        self.assertEquals(Notification.objects.all().count(), 3)

        # and 3 of them for user2
        self.assertEquals(Notification.objects.filter(user=self.user2, created_by=self.user1).count(), 3)

    def test_read_one_notification(self):
        """
        Tests reading one notification
        :return:
        """
        # there should be zero notifications to begin with
        self.assertEquals(Notification.objects.all().count(), 0)

        # create a new task
        task, response = self.create_task_orm(
            self.token1, None, "Some Task", "With some description", Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL,
            timezone.now(), timezone.now(), [self.user1.pk, self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # unlock the task with user1
        response = self.unlock(self.token1, "tasks", task.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 changes the task
        response = self.rest_update_task(
            self.token2, str(task.pk), None, "Some Task !!!", "With some description",
            Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL,
            timezone.now(), timezone.now(), [self.user1.pk, self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # there should be 3 notifications
        self.assertEquals(Notification.objects.all().count(), 3)
        # and all of them should be unread
        self.assertEquals(Notification.objects.filter(read=False).count(), 3)
        # two of them should be for user2
        self.assertEquals(Notification.objects.filter(user=self.user2).count(), 2)

        # now let user2 read one of the notifications
        response = self.rest_mark_notification_as_read(self.token2,
                                                       str(Notification.objects.filter(user=self.user2).first().pk),
                                                       HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should have one unread and one read notification
        self.assertEquals(Notification.objects.filter(read=False, user=self.user2).count(), 1)
        self.assertEquals(Notification.objects.filter(read=True, user=self.user2).count(), 1)

        # but user1 should still have one unread notification
        self.assertEquals(Notification.objects.filter(read=False, user=self.user1).count(), 1)

    def test_read_all_notifications(self):
        """
        Tests reading all notifications
        :return:
        """
        # there should be zero notifications to begin with
        self.assertEquals(Notification.objects.all().count(), 0)

        # create a new task
        task, response = self.create_task_orm(
            self.token1, None, "Some Task", "With some description", Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL,
            timezone.now(), timezone.now(), [self.user1.pk, self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # unlock the task with user1
        response = self.unlock(self.token1, "tasks", task.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 changes the task
        response = self.rest_update_task(
            self.token2, str(task.pk), None, "Some Task !!!", "With some description",
            Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL,
            timezone.now(), timezone.now(), [self.user1.pk, self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # there should be 3 notifications
        self.assertEquals(Notification.objects.all().count(), 3)
        # and all of them should be unread
        self.assertEquals(Notification.objects.filter(read=False).count(), 3)
        # two of them should be for user2
        self.assertEquals(Notification.objects.filter(user=self.user2).count(), 2)

        # now let user2 read one of the notifications
        response = self.rest_mark_all_notifications_as_read(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should have no unread notifications
        self.assertEquals(Notification.objects.filter(read=False, user=self.user2).count(), 0)
        self.assertEquals(Notification.objects.filter(read=True, user=self.user2).count(), 2)

        # but user1 should still have one unread notification
        self.assertEquals(Notification.objects.filter(read=False, user=self.user1).count(), 1)


class AppointmentConfirmationMailTest(
    APITestCase, CommonTestMixin, AuthenticationMixin, UserMixin, MeetingMixin, NotificationMixIn,
    ResourceMixin,
):
    def setUp(self):
        self.user_group = Group.objects.get(name='User')
        self.user1, self.token1 = self.create_user_and_log_in(
            username='user1', email='one@test.local', groups=['User']
        )
        self.user2, self.token2 = self.create_user_and_log_in(
            username='user2', email='two@test.local', groups=['User']
        )

    def test_confirmation_mail_sent_for_plain_appointment(self):
        # user1 creates an appointment
        meeting, response = self.create_meeting_orm(
            auth_token=self.token1,
            project_pk=None,
            title='Study Session 101',
            description='Test 😀',
            location='E123.435-STUDY7',
            start_date=naive_dt(2020, 1, 2, 20, 15),
            end_date=naive_dt(2020, 1, 2, 22, 30),
            **HTTP_INFO,
        )
        self.assert_response_status(response, expected_status_code=status.HTTP_201_CREATED)

        # check that email was sent to the creator
        self.assertEqual(1, len(mail.outbox))
        email = mail.outbox[0]
        self.assertEqual(1, len(email.to))
        self.assertEqual(self.user1.email, email.to[0])
        self.assertIn('confirm', email.subject.lower())
        self.assertIn(meeting.title, email.subject)

        self.assert_appointment_data_in_mail(email, meeting, resource=None)

    # todo: un-skip
    @unittest.skip("Skip to fix CI error")
    def test_confirmation_mail_contains_full_user_name(self):
        first_name = 'Mario Luigi Yoshi Toad'
        last_name = 'Bowser-Cooper-Ghost-Plant'

        profile = self.user1.userprofile
        profile.first_name = first_name
        profile.last_name = last_name
        profile.save()

        # user1 creates an appointment
        meeting, response = self.create_meeting_orm(
            auth_token=self.token1,
            project_pk=None,
            title='Study Session 101',
            description='Test 😀',
            location='E123.435-STUDY7',
            start_date=naive_dt(2020, 1, 2, 20, 15),
            end_date=naive_dt(2020, 1, 2, 22, 30),
            **HTTP_INFO,
        )
        self.assert_response_status(response, expected_status_code=status.HTTP_201_CREATED)

        # check that email was sent to the creator
        self.assertEqual(1, len(mail.outbox))
        email = mail.outbox[0]
        self.assertEqual(1, len(email.to))
        self.assertEqual(self.user1.email, email.to[0])

        # check text content
        self.assertIn(first_name, email.body)
        self.assertIn(last_name, email.body)

        # check html content
        html_body = email.alternatives[0][0]
        self.assertIn(first_name, html_body)
        self.assertIn(last_name, html_body)

    def test_confirmation_mail_content_with_resource_booking(self):
        # user1 creates a resource
        resource, response = self.create_resource_orm(
            auth_token=self.token1, project_pks=None,
            name='My Test Resource', description='My Test Resource Description',
            location='Somewhere over the rainbow',
            resource_type=Resource.ROOM, user_availability=Resource.GLOBAL,
            **HTTP_INFO
        )
        self.assert_response_status(response, expected_status_code=status.HTTP_201_CREATED)

        # user1 creates a resource booking
        meeting, response = self.create_meeting_orm(
            auth_token=self.token1,
            project_pk=None,
            title='Study Session 101',
            description='Test Description',
            start_date=naive_dt(2020, 1, 2, 20, 15),
            end_date=naive_dt(2020, 1, 2, 22, 30),
            **HTTP_INFO,
            resource_pk=resource.pk,
        )
        self.assert_response_status(response, status.HTTP_201_CREATED)

        # check that email was sent to the creator
        self.assertEqual(1, len(mail.outbox))
        email = mail.outbox[0]
        self.assertEqual(1, len(email.to))
        self.assertEqual(self.user1.email, email.to[0])
        self.assertIn('confirm', email.subject.lower())
        self.assertIn(meeting.title, email.subject)

        self.assert_appointment_data_in_mail(email, meeting, resource)

    def test_create_for_user_is_notified_too(self):
        """ Tests that an appointments 'create_for' user receives a confirmation too """

        # user2 grants user1 full calendar access
        with FakeRequest(), FakeRequestUser(self.user2):
            user2_calendar_access = ModelPrivilege.objects.get(
                content_type=CalendarAccess.get_content_type(),
                user=self.user2
            )
            ModelPrivilege.objects.create(
                user=self.user1,
                content_type=CalendarAccess.get_content_type(),
                object_id=user2_calendar_access.pk,
            )

        # user1 creates an appointment for user2
        meeting, response = self.create_meeting_orm(
            auth_token=self.token1,
            project_pk=None,
            title='Appointment for user2',
            description='Test',
            start_date=naive_dt(2020, 1, 2, 20, 15),
            end_date=naive_dt(2020, 1, 2, 22, 30),
            **HTTP_INFO,
            create_for=self.user2.pk,
        )
        self.assert_response_status(response, status.HTTP_201_CREATED)

        # check that email was sent to the creator
        self.assertEqual(1, len(mail.outbox))
        email = mail.outbox[0]
        self.assertEqual(1, len(email.to))
        self.assertEqual(self.user1.email, email.to[0])
        self.assertIn('confirm', email.subject.lower())

        # check that a notification has been created for the create_for user
        user2_notification_qs = Notification.objects.filter(user=self.user2)
        self.assertEqual(1, user2_notification_qs.count())
        notification = user2_notification_qs.first()
        self.assertIn('added to', notification.title.lower())
        self.assertEqual(
            NotificationConfiguration.NOTIFICATION_CONF_MEETING_USER_CHANGED,
            notification.notification_type
        )

    def test_no_confirmation_mail_if_setting_disabled(self):
        # user1 unsubscribes from confirmation mails
        with FakeRequest(), FakeRequestUser(self.user1):
            notification_cfg = NotificationConfiguration.objects.get(user=self.user1)
            notification_cfg.allowed_notifications.remove(NotificationConfiguration.MAIL_CONF_MEETING_CONFIRMATION)
            notification_cfg.save()

        # user1 creates a resource booking
        meeting, response = self.create_meeting_orm(
            auth_token=self.token1,
            project_pk=None,
            title='My Appointment',
            description='Hello Test 123',
            start_date=naive_dt(2020, 1, 2, 20, 15),
            end_date=naive_dt(2020, 1, 2, 22, 30),
            **HTTP_INFO,
        )
        self.assert_response_status(response, status.HTTP_201_CREATED)

        # check that no mail was sent
        self.assertEqual(0, len(mail.outbox))

    def test_confirmation_mail_for_attending_users_is_extra_mail(self):
        # user1 creates an appointment with user2 as attending user
        meeting, response = self.create_meeting_orm(
            auth_token=self.token1,
            project_pk=None,
            title='Group Session',
            description='Test Desc',
            location='Conference Room',
            start_date=naive_dt(2020, 10, 1),
            end_date=naive_dt(2020, 10, 3),
            **HTTP_INFO,
            attending_users=[self.user2.pk],
        )
        self.assert_response_status(response, expected_status_code=status.HTTP_201_CREATED)

        # check that email was sent to the creator
        self.assertEqual(1, len(mail.outbox))
        email = mail.outbox[0]
        self.assertEqual(1, len(email.to))
        self.assertEqual(self.user1.email, email.to[0])
        self.assertIn('confirm', email.subject.lower())

        # check that a notification has been created for the attending users
        user2_notifications_qs = Notification.objects.filter(user=self.user2)
        self.assertEqual(1, user2_notifications_qs.count())

        # make some changes to the appointment, so there are more notifications
        with FakeRequest(), FakeRequestUser(self.user1):
            meeting.text = 'Edit: Bring your own lunch'
            meeting.save()

        # check that there are more notifications now
        user2_notifications_qs = Notification.objects.filter(user=self.user2)
        self.assertTrue(user2_notifications_qs.count() > 1)

        # clear mailbox
        mail.outbox.clear()

        # send notifications mails
        from eric.notifications.management.commands.send_notifications import Command as send_notifications_command
        send_notifications_command().handle()

        # check that all notifications have been sent
        unsent_notifications_qs = Notification.objects.filter(sent__isnull=True)
        self.assertEqual(0, unsent_notifications_qs.count())

        # check that the confirmation has been sent and it was not aggregated with other notifications
        self.assertEquals(2, len(mail.outbox))

        self.assertEqual(self.user2.email, mail.outbox[0].to[0])
        self.assertIn('added to', mail.outbox[0].subject)

        self.assertEqual(self.user2.email, mail.outbox[1].to[0])
        self.assertIn('has changed', mail.outbox[1].subject)

    def assert_appointment_data_in_mail(self, email, meeting, resource=None):
        # check that there is plaintext and html
        self.assertEqual(1, len(email.alternatives))
        self.assertEqual('text/html', email.alternatives[0][1])
        html_body = email.alternatives[0][0]

        # check appointment title
        self.assertIn(meeting.title, email.body)
        self.assertIn(meeting.title, html_body)

        # check start date
        start_date_str = date_short(localtime(meeting.date_time_start))
        self.assertIn(start_date_str, email.body)
        self.assertIn(start_date_str, html_body)

        # check end date
        end_date_str = date_short(localtime(meeting.date_time_end))
        self.assertIn(end_date_str, email.body)
        self.assertIn(end_date_str, html_body)

        # check description
        self.assertIn(meeting.text, email.body)
        self.assertIn(meeting.text, html_body)

        # check location
        if meeting.location:
            self.assertIn(meeting.location, email.body)
            self.assertIn(meeting.location, html_body)

        if resource:
            # check resource
            self.assertIn(resource.name, email.body)
            self.assertIn(resource.name, html_body)

            # check resource location
            self.assertIn(resource.location, email.body)
            self.assertIn(resource.location, html_body)


class ScheduledNotificationsTest(APITestCase, CommonTestMixin, AuthenticationMixin, UserMixin, MeetingMixin,
                                 NotificationMixIn):
    def setUp(self):
        self.user_group = Group.objects.get(name='User')
        self.user1, self.token1 = self.create_user_and_log_in(
            username='user1', email='one@test.local', groups=['User']
        )

    def test_creating_scheduled_notifications_for_meeting(self):
        """ Tests creating a scheduled notification for a new meeting """

        # there should be zero scheduled notifications to begin with
        self.assertEquals(ScheduledNotification.objects.all().count(), 0)

        now_plus_15 = timezone.now() + timezone.timedelta(minutes=15)
        now_plus_20 = timezone.now() + timezone.timedelta(minutes=20)
        now_plus_35 = timezone.now() + timezone.timedelta(minutes=35)
        now_plus_30 = timezone.now() + timezone.timedelta(minutes=30)
        now_plus_60 = timezone.now() + timezone.timedelta(minutes=60)

        # create an appointment 20 minutes from now with a reminder of 15 minutes before
        meeting, response = self.create_meeting_orm(
            auth_token=self.token1,
            project_pk=None,
            title='Study Session 101',
            description='Test 😀',
            location='E123.435-STUDY7',
            start_date=now_plus_20,
            end_date=now_plus_60,
            scheduled_notification_writable={
                "active": True,
                "timedelta_unit": "MINUTE",
                "timedelta_value": 10
            },
            **HTTP_INFO,
        )
        self.assert_response_status(response, expected_status_code=status.HTTP_201_CREATED)

        # there should be one scheduled notification now
        self.assertEquals(ScheduledNotification.objects.all().count(), 1)

        # get the scheduled_date_time of the ScheduledNotification
        scheduled_notification_datetime = ScheduledNotification.objects.all().first().scheduled_date_time

        # travel in time 15 minutes forward
        with time_machine.travel(now_plus_15, tick=False):
            # edit the meeting
            response = self.rest_update_meeting(
                self.token1, meeting.pk, [],
                "First meeting edited",
                "Some other Text for this meeting",
                now_plus_30, now_plus_60,
                HTTP_USER_AGENT, REMOTE_ADDR
            )
            self.assertEquals(response.status_code, status.HTTP_200_OK)

            # again get the scheduled_date_time of the ScheduledNotification after the edit
            new_scheduled_notification_datetime = ScheduledNotification.objects.all().first().scheduled_date_time

            # the scheduled_date_time should have changed here
            self.assertNotEquals(scheduled_notification_datetime, new_scheduled_notification_datetime)

        # travel in time 30 minutes forward
        with time_machine.travel(now_plus_35, tick=False):
            # edit the meeting
            response = self.rest_update_meeting(
                self.token1, meeting.pk, [],
                "First meeting edited",
                "Some other Text for this meeting",
                now_plus_30, now_plus_60,
                HTTP_USER_AGENT, REMOTE_ADDR
            )
            self.assertEquals(response.status_code, status.HTTP_200_OK)

            # again get the scheduled_date_time of the ScheduledNotification after the edit
            second_new_scheduled_notification_datetime = ScheduledNotification.objects.all().first().scheduled_date_time

            # the scheduled_date_time should not have changed as the meeting.date_time_start is in the past, so
            # no new scheduled notification should be sent
            self.assertEquals(second_new_scheduled_notification_datetime, new_scheduled_notification_datetime)


class TaskReminderNotificationsTest(APITestCase, CommonTestMixin, AuthenticationMixin, UserMixin, TaskMixin,
                                    NotificationMixIn):
    def setUp(self):
        self.user_group = Group.objects.get(name='User')
        self.user1, self.token1 = self.create_user_and_log_in(
            username='user1', email='one@test.local', groups=['User']
        )
        self.user2, self.token2 = self.create_user_and_log_in(
            username='user2', email='two@test.local', groups=['User']
        )
        self.user3, self.token3 = self.create_user_and_log_in(
            username='user3', email='three@test.local', groups=['User']
        )

    def test_creating_reminder_notifications_for_tasks(self):
        """ Tests creating a reminder notification for a new task """

        # there should be zero notifications to begin with
        self.assertEquals(Notification.objects.all().count(), 0)

        now_plus_20 = timezone.now() + timezone.timedelta(minutes=20)
        now_plus_30 = timezone.now() + timezone.timedelta(minutes=30)
        now_plus_35 = timezone.now() + timezone.timedelta(minutes=35)
        now_plus_60 = timezone.now() + timezone.timedelta(minutes=60)

        # create a task with a reminder
        response = self.rest_create_task(
            auth_token=self.token1,
            project_pks=[],
            title='Task 101',
            description='Test 😀',
            state=Task.TASK_STATE_PROGRESS,
            priority=Task.TASK_PRIORITY_NORMAL,
            start_date=timezone.now(),
            due_date=now_plus_60,
            HTTP_USER_AGENT="APITestClient",
            REMOTE_ADDR="127.0.0.1",
            assigned_user=[self.user1.pk, self.user2.pk, self.user3.pk],
            remind_assignees=True,
            reminder_datetime=now_plus_30,
        )
        self.assert_response_status(response, expected_status_code=status.HTTP_201_CREATED)

        # there should be 4 notifications now (2 Task changed, 2 you have been added)
        self.assertEquals(Notification.objects.all().count(), 4)

        # travel in time 20 minutes forward
        with time_machine.travel(now_plus_20, tick=False):
            from eric.notifications.management.commands.send_notifications import Command as send_notifications_command
            send_notifications_command().handle()

            reminder_notifications = Notification.objects.all().filter(title__startswith="Reminder: Task Task 101")
            # there should be 0 reminder notifications now
            self.assertEquals(reminder_notifications.count(), 0)

        # travel in time 30 minutes forward
        with time_machine.travel(now_plus_30, tick=False):
            from eric.notifications.management.commands.send_notifications import Command as send_notifications_command
            send_notifications_command().handle()

            reminder_notifications = Notification.objects.all().filter(title__startswith="Reminder: Task Task 101")
            # there should be 3 reminder notifications now
            self.assertEquals(reminder_notifications.count(), 3)

        # travel in time 35 minutes forward
        with time_machine.travel(now_plus_35, tick=False):
            from eric.notifications.management.commands.send_notifications import Command as send_notifications_command
            send_notifications_command().handle()

            reminder_notifications = Notification.objects.all().filter(title__startswith="Reminder: Task Task 101")
            # there should still be 3 reminder notifications now
            self.assertEquals(reminder_notifications.count(), 3)
