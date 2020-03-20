#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone

from rest_framework.test import APITestCase
from rest_framework import status

from eric.notifications.models import Notification, NotificationConfiguration
from eric.notifications.tests.core import NotificationMixIn
from eric.relations.tests.core import RelationsMixin
from eric.shared_elements.models import Task, Meeting
from eric.projects.tests.core import AuthenticationMixin, UserMixin
from eric.shared_elements.tests.core import TaskMixin, MeetingMixin

User = get_user_model()

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


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
        response = self.rest_update_task_assigned_users(self.token1, str(task.pk), [self.user1.pk], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # there should be 4 notifications
        self.assertEquals(Notification.objects.all().count(), 4)

        # and 3 of them for user2
        self.assertEquals(Notification.objects.filter(user=self.user2, created_by=self.user1).count(), 3)

    def test_creating_notifications_meeting(self):
        """
        Tests creating a notification for a new meeting
        :return:
        """
        # there should be zero notifications to begin with
        self.assertEquals(Notification.objects.all().count(), 0)

        # create a new task
        meeting, response = self.create_meeting_orm(
            self.token1, None, "Some Meeting", "With some description",
            timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # add user1 and user2 to meeting
        self.rest_update_meeting_attending_users(self.token1, str(meeting.pk), [self.user1.pk, self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR)

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
        response = self.rest_mark_notification_as_read(self.token2, str(Notification.objects.filter(user=self.user2).first().pk), HTTP_USER_AGENT, REMOTE_ADDR)
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
