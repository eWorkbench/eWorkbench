#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import os
import logging
from datetime import timedelta

from django.db.models.signals import post_delete, pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone
from eric.base64_image_extraction.utils import convert_text_with_base64_images_to_file_references
from eric.core.tests import custom_json_handler
from eric.ms_office_handling.models.handlers import OFFICE_TEMP_FILE_PREFIX
from eric.shared_elements.models import File, Meeting, Note, Task, UploadedFileEntry
from eric.versions.models import Version
from django.utils.translation import ugettext_lazy as _
from time import sleep


logger = logging.getLogger('eric.shared_elements.models.handlers')


@receiver(post_delete)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes physical file from filesystem
    when corresponding `File` or `UploadedFileEntry` object is deleted.
    """
    if sender != File and sender != UploadedFileEntry:
        return

    if instance.path and os.path.isfile(instance.path.path):
        try:
            os.remove(instance.path.path)
        except OSError as error:
            logger.error("ERROR: OSError in auto_delete_file_on_delete: {}".format(error))


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
    instance.description = convert_text_with_base64_images_to_file_references(instance, 'description')


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
    instance.text = convert_text_with_base64_images_to_file_references(instance, 'text')


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
    instance.content = convert_text_with_base64_images_to_file_references(instance, 'content')


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
    instance.description = convert_text_with_base64_images_to_file_references(instance, 'description')


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
        if not instance.projects.all() \
                and instance.directory \
                and instance.directory.drive.projects.all() \
                and not instance.name.startswith(OFFICE_TEMP_FILE_PREFIX):
            for project in instance.directory.drive.projects.all():
                instance.projects.add(project.pk)
    except:
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
            Version.objects.create(
                content_type=content_type,
                object_id=object_id,
                metadata=metadata,
                summary=summary
            )
    except Exception as error:
        logger.error("ERROR: Error in handle_version_on_file_path_updates: {}".format(error))


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
        if not old_file.path.path == instance.path.path:
            handle_version_on_file_path_updates(old_file)
