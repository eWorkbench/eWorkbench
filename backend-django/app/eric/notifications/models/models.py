#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import datetime
import uuid

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from django_changeset.models import RevisionModelMixin
from django_cleanhtmlfield.fields import HTMLField

from eric.core.models import BaseModel
from eric.core.models.abstract import ChangeSetMixIn, SoftDeleteMixin
from eric.notifications.models.managers import (
    NotificationConfigurationManager,
    NotificationManager,
    ScheduledNotificationManager,
)


class NotificationConfiguration(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """Defines the configuration (allowed notifications) for a user"""

    # Notification configuration states

    # Meeting
    NOTIFICATION_CONF_MEETING_USER_CHANGED = "NOTIFICATION_CONF_MEETING_USER_CHANGED"
    NOTIFICATION_CONF_MEETING_CHANGED = "NOTIFICATION_CONF_MEETING_CHANGED"
    NOTIFICATION_CONF_MEETING_RELATION_CHANGED = "NOTIFICATION_CONF_MEETING_RELATION_CHANGED"
    NOTIFICATION_CONF_MEETING_REMINDER = "NOTIFICATION_CONF_MEETING_REMINDER"
    MAIL_CONF_MEETING_CONFIRMATION = "MAIL_CONF_MEETING_CONFIRMATION"

    # Task
    NOTIFICATION_CONF_TASK_USER_CHANGED = "NOTIFICATION_CONF_TASK_USER_CHANGED"
    NOTIFICATION_CONF_TASK_CHANGED = "NOTIFICATION_CONF_TASK_CHANGED"
    NOTIFICATION_CONF_TASK_RELATION_CHANGED = "NOTIFICATION_CONF_TASK_RELATION_CHANGED"
    NOTIFICATION_CONF_TASK_REMINDER = "NOTIFICATION_CONF_TASK_REMINDER"

    # Project
    NOTIFICATION_CONF_PROJECT_USER_CHANGED = "NOTIFICATION_CONF_PROJECT_USER_CHANGED"
    NOTIFICATION_CONF_PROJECT_CHANGED = "NOTIFICATION_CONF_PROJECT_CHANGED"
    NOTIFICATION_CONF_PROJECT_COMMENT = "NOTIFICATION_CONF_PROJECT_COMMENT"

    # DSS
    NOTIFICATION_DSS_IMPORT_IN_PROGRESS = "NOTIFICATION_DSS_IMPORT_IN_PROGRESS"
    NOTIFICATION_DSS_IMPORT_FINISHED = "NOTIFICATION_DSS_IMPORT_FINISHED"
    NOTIFICATION_DSS_IMPORT_FAILED = "NOTIFICATION_DSS_IMPORT_FAILED"

    NOTIFICATION_CONF_CHOICES = (
        (NOTIFICATION_CONF_MEETING_USER_CHANGED, _("Attended users of meeting has been changed")),
        (NOTIFICATION_CONF_MEETING_CHANGED, _("Meeting has been changed")),
        (NOTIFICATION_CONF_MEETING_RELATION_CHANGED, _("Relation of meeting has been changed")),
        (NOTIFICATION_CONF_MEETING_REMINDER, _("Remind of meeting")),
        (MAIL_CONF_MEETING_CONFIRMATION, _("Confirmation mail for created meetings")),
        (NOTIFICATION_CONF_TASK_USER_CHANGED, _("Assigned users of task has been changed")),
        (NOTIFICATION_CONF_TASK_CHANGED, _("Task has been changed")),
        (NOTIFICATION_CONF_TASK_RELATION_CHANGED, _("Relation of task has been changed")),
        (NOTIFICATION_CONF_TASK_REMINDER, _("Remind of task")),
        (NOTIFICATION_CONF_PROJECT_USER_CHANGED, _("Users of project has been changed")),
        (NOTIFICATION_CONF_PROJECT_CHANGED, _("Project has been changed")),
        (NOTIFICATION_CONF_PROJECT_COMMENT, _("A new project comment has been posted")),
        (NOTIFICATION_DSS_IMPORT_IN_PROGRESS, _("DSS import in progress")),
        (NOTIFICATION_DSS_IMPORT_FINISHED, _("DSS import finished")),
        (NOTIFICATION_DSS_IMPORT_FAILED, _("DSS import failed")),
    )

    objects = NotificationConfigurationManager()

    class Meta:
        verbose_name = _("NotificationConfiguration")
        verbose_name_plural = _("NotificationConfigurations")
        # track all fields
        track_fields = (
            "allowed_notifications",
            "user",
        )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.OneToOneField(
        "projects.MyUser",
        on_delete=models.CASCADE,
        related_name="notification_configuration",
        verbose_name=_("Notification configuration of the user"),
    )

    allowed_notifications = ArrayField(
        models.CharField(max_length=64, choices=NOTIFICATION_CONF_CHOICES),
        default=list,
        blank=True,
        null=True,
        verbose_name=_("Notifications that the user want to receive"),
    )

    def __str__(self):
        return _("Notification configuration for {user}").format(user=str(self.user))


class Notification(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """defines a notification which will be send to the user"""

    objects = NotificationManager()

    class Meta:
        verbose_name = _("Notification")
        verbose_name_plural = _("Notifications")
        ordering = (
            "-last_modified_at",
            "-created_at",
        )
        track_fields = ("title", "read", "sent", "processed", "object_id", "content_type")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        "projects.MyUser",
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name=_("Notifications for the user"),
    )

    title = models.TextField(
        verbose_name=_("Title of the notification"),
    )

    message = HTMLField(
        verbose_name=_("Message of the notification"),
        strip_unsafe=True,
    )

    notification_type = models.CharField(
        max_length=64,
        choices=NotificationConfiguration.NOTIFICATION_CONF_CHOICES,
        verbose_name=_("Type of the notification (e.g., why it was triggered)"),
        db_index=True,
    )

    sent = models.DateTimeField(null=True, blank=True, verbose_name=_("Date when notification was sent"))

    processed = models.BooleanField(verbose_name=_("If notification was processed"), default=False, db_index=True)

    read = models.BooleanField(verbose_name=_("If user had read the notification"), default=False)

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name=_("Content type of the notification content"),
        null=True,
        blank=True,
    )

    object_id = models.UUIDField(verbose_name=_("Object id of the notification content"), null=True, blank=True)

    content_object = GenericForeignKey("content_type", "object_id")

    def __str__(self):
        return _("Notification {title}").format(title=self.title)


class ScheduledNotification(
    BaseModel,
    ChangeSetMixIn,
    SoftDeleteMixin,
):
    """schedules a notification on a given point in the future for a given object"""

    objects = ScheduledNotificationManager()

    class Meta:
        verbose_name = _("ScheduledNotification")
        verbose_name_plural = _("ScheduledNotifications")
        track_fields = ("scheduled_date_time", "object_id", "content_type")

    TIME_UNIT_MINUTE = "MINUTE"
    TIME_UNIT_HOUR = "HOUR"
    TIME_UNIT_DAY = "DAY"
    TIME_UNIT_WEEK = "WEEK"

    TIME_UNIT_CHOICES = (
        (TIME_UNIT_MINUTE, _("minutes")),
        (TIME_UNIT_HOUR, _("hours")),
        (TIME_UNIT_DAY, _("days")),
        (TIME_UNIT_WEEK, _("weeks")),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    scheduled_date_time = models.DateTimeField(verbose_name=_("Scheduled date time"))

    timedelta_value = models.IntegerField(
        verbose_name=_("Time value when the notification should created"),
    )

    timedelta_unit = models.CharField(
        max_length=6, choices=TIME_UNIT_CHOICES, verbose_name=_("Time unit when the notification should be created")
    )

    active = models.BooleanField(verbose_name=_("If scheduled notification is active"), default=False, db_index=True)

    processed = models.BooleanField(
        verbose_name=_("If scheduled notification was processed"), default=False, db_index=True
    )

    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, verbose_name=_("Content type"), null=True, blank=True
    )

    object_id = models.UUIDField(
        verbose_name=_("Object id of the scheduled notification content"), null=True, blank=True, unique=True
    )

    content_object = GenericForeignKey("content_type", "object_id")

    def __str__(self):
        return _("Scheduled Notification on {scheduled_date_time} for {objectid}").format(
            scheduled_date_time=self.scheduled_date_time,
            objectid=self.object_id,
        )

    @staticmethod
    def calculate_scheduled_date_time(time_unit, timedelta_value, date_time_start):
        if time_unit == ScheduledNotification.TIME_UNIT_MINUTE:
            delta = datetime.timedelta(minutes=timedelta_value)
        elif time_unit == ScheduledNotification.TIME_UNIT_HOUR:
            delta = datetime.timedelta(hours=timedelta_value)
        elif time_unit == ScheduledNotification.TIME_UNIT_DAY:
            delta = datetime.timedelta(days=timedelta_value)
        elif time_unit == ScheduledNotification.TIME_UNIT_WEEK:
            delta = datetime.timedelta(weeks=timedelta_value)
        else:
            raise ValidationError("Unhandled time unit")

        return date_time_start - delta
