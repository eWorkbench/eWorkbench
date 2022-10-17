#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import logging
import os
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from django_rest_multitokenauth.signals import post_auth
from django_userforeignkey.request import get_current_request

from eric.base64_image_extraction.utils import convert_text_with_base64_images_to_file_references
from eric.core.tests import custom_json_handler
from eric.model_privileges.models import ModelPrivilege
from eric.ms_office_handling.models.handlers import OFFICE_TEMP_FILE_PREFIX
from eric.shared_elements.models import CalendarAccess, Comment, File, Meeting, Note, Task, UploadedFileEntry
from eric.versions.models import Version

logger = logging.getLogger(__name__)


@receiver(post_auth)
@transaction.atomic  # make sure that CalendarAccess and ModelPrivilege are both created or none of them
def auto_create_calendar_access_privileges(sender, user, *args, **kwargs):
    """
    On post_auth, automatically create the calendar access privileges (if the user does not have any) and give
    the user full_access_privilege for his calendar.
    This is needed so new users get to have the Calendar Access Privileges. There is also a migration operation that
    does the same for existing users, but that won't work for users that come after the migration.
    """

    # set current requests user (as during auth, that user is not set yet)
    request = get_current_request()
    if request and (not hasattr(request, "user") or request.user.is_anonymous):
        request.user = user

    # make sure the user has a calendar access object
    own_calendar_access, created = CalendarAccess.objects.get_or_create(created_by=user)
    if created:
        # make sure the user has full access to his own calendar
        ModelPrivilege.objects.get_or_create(
            user=user,
            content_type=CalendarAccess.get_content_type(),
            object_id=own_calendar_access.pk,
            defaults={
                "full_access_privilege": ModelPrivilege.ALLOW,
            },
        )


@receiver(pre_delete, sender=ModelPrivilege)
@receiver(pre_save, sender=ModelPrivilege)
def prevent_change_of_own_calendar_access_privilege(sender, instance, *args, **kwargs):
    """
    The user should always be able to access his own calendar
    """
    if not instance.content_object:
        return

    if not instance.pk:
        return

    obj = ModelPrivilege.objects.filter(pk=instance.pk).first()
    content_type = instance.content_object.get_content_type()
    if obj and content_type == CalendarAccess.get_content_type() and obj.created_by == obj.user:
        raise ValidationError(
            {
                "non_field_errors": ValidationError(
                    _("Full access to the own calendar cannot be removed"),
                    params={"full_access_privilege": instance.full_access_privilege},
                    code="invalid",
                )
            }
        )


@receiver(post_delete)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes physical file from filesystem
    when corresponding `File` or `UploadedFileEntry` object is deleted.
    """
    if sender != File and sender != UploadedFileEntry:
        return

    # we should never delete files on dss containers
    if instance.path and os.path.isfile(instance.path.path) and not instance.is_dss_file:
        try:
            os.remove(instance.path.path)
        except OSError as error:
            logger.error(f"ERROR: OSError in auto_delete_file_on_delete: {error}")


@receiver(pre_save, sender=File)
def convert_file_description_with_base64_images_to_file_references(sender, instance, *args, **kwargs):
    """
    Parse file description, find base64 references, upload image files to system and convert references to image URLs.

    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    instance.description = convert_text_with_base64_images_to_file_references(instance, "description")


@receiver(pre_save, sender=Meeting)
def convert_meeting_text_with_base64_images_to_file_references(sender, instance, *args, **kwargs):
    """
    Parse meeting text, find base64 references, upload image files to system and convert references to image URLs.

    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    instance.text = convert_text_with_base64_images_to_file_references(instance, "text")


@receiver(pre_save, sender=Note)
def convert_note_content_with_base64_images_to_file_references(sender, instance, *args, **kwargs):
    """
    Parse note content, find base64 references, upload image files to system and convert references to image URLs.

    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    instance.content = convert_text_with_base64_images_to_file_references(instance, "content")


@receiver(pre_save, sender=Comment)
def convert_comment_content_with_base64_images_to_file_references(sender, instance, *args, **kwargs):
    """
    Parse comment content, find base64 references, upload image files to system and convert references to image URLs.

    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    instance.content = convert_text_with_base64_images_to_file_references(instance, "content")


@receiver(pre_save, sender=Task)
def convert_task_description_with_base64_images_to_file_references(sender, instance, *args, **kwargs):
    """
    Parse task description, find base64 references, upload image files to system and convert references to image URLs.

    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    instance.description = convert_text_with_base64_images_to_file_references(instance, "description")


@receiver(post_save, sender=File)
def rename_original_filename_after_current_name(sender, instance, *args, **kwargs):
    """
    Changes the original_filename field of the current UploadedFileEntry when a file name is renamed
    :param sender: File
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    if not instance.uploaded_file_entry:
        return

    try:
        # try to get the current UploadedFileEntry
        current_file_entry = UploadedFileEntry.objects.get(pk=instance.uploaded_file_entry.pk)
        # when a file is renamed also rename the original_filename on the entry
        if instance.name != current_file_entry.original_filename:
            current_file_entry.original_filename = instance.name
            current_file_entry.save()
    except UploadedFileEntry.DoesNotExist:
        pass


@receiver(post_save, sender=File)
def add_project_for_webdav_uploads(sender, instance, *args, **kwargs):
    """
    New files from webdav have no project, give it that of the storage if that exists.
    :param sender: File
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    try:
        if (
            not instance.projects.all()
            and instance.directory
            and instance.directory.drive.projects.all()
            and not instance.name.startswith(OFFICE_TEMP_FILE_PREFIX)
        ):
            for project in instance.directory.drive.projects.all():
                instance.projects.add(project.pk)
    except Exception:
        pass


def handle_version_on_file_path_updates(old_file):
    """
    Actually creates the Version using the old_file data
    :param old_file:
    :return:
    """
    try:
        now = timezone.now()
        now_delta = now - timedelta(seconds=2)
        object_id = old_file.pk
        metadata = old_file.export_metadata()
        metadata = json.loads(json.dumps(metadata, default=custom_json_handler))
        content_type = old_file.get_content_type()
        summary = _("File replaced: {} (auto-generated)").format(old_file.name)
        same_version = Version.objects.filter(
            object_id=object_id,
            created_at__gte=now_delta,
            content_type=content_type,
        ).exists()
        if not same_version:
            Version.objects.create(content_type=content_type, object_id=object_id, metadata=metadata, summary=summary)
    except Exception as error:
        logger.error(f"ERROR: Error in handle_version_on_file_path_updates: {error}")


@receiver(pre_save, sender=File)
def create_version_on_file_path_updates(sender, instance, *args, **kwargs):
    """
    Before saving a File, check if the path.path is being updated and create a version using the old data.
    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    try:
        old_file = File.objects.get(pk=instance.pk)
    except File.DoesNotExist:
        pass  # Object is new.
    else:
        if instance.path and not old_file.path.path == instance.path.path:
            handle_version_on_file_path_updates(old_file)
