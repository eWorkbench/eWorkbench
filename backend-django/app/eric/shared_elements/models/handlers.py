#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import logging

from django.db.models.signals import post_delete, pre_save, post_save
from django.dispatch import receiver

from eric.base64_image_extraction.utils import convert_text_with_base64_images_to_file_references
from eric.ms_office_handling.models.handlers import OFFICE_TEMP_FILE_PREFIX
from eric.shared_elements.models import File, Meeting, Note, Task, UploadedFileEntry


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
