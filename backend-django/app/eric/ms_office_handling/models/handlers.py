#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.files.base import ContentFile
from functools import reduce

import os
import logging
import operator

from django.conf import settings

from datetime import timedelta

from django.db.models import Q

from django.db.models.signals import post_save
from django.dispatch import receiver

from eric.core.models import DisableSignals, disable_permission_checks
from eric.shared_elements.models import File, UploadedFileEntry

from django_userforeignkey.request import get_current_user

from time import sleep


logger = logging.getLogger('eric.ms_office_handling.models.handlers')


OFFICE_TEMP_FILE_PREFIX = '~$'

MS_OFFICE_EXTENSIONS = (
    '.xlsx',
    '.docx',
    '.xls',
    '.doc',
    '.tmp',
    '.ods',
    '.xslm',
    '.xlsb',
    '.csv',
    '.xml',
    '.xltx',
    '.xltm',
    '.xlt',
    '.xlam',
    '.xla',
    '.docm',
    '.dotx',
    '.dotm',
    '.dot',
    '.txt',
)


def has_ms_office_extension(filename):
    """
    checks if a file has an ms office extension
    :param filename:
    :return: boolean
    """
    for ms_office_extension in MS_OFFICE_EXTENSIONS:
        if filename.endswith(ms_office_extension):
            return True
    return False


def get_original_file(instance, user):
    return File.objects.all().filter(
        name__contains=instance.name[2:],
        last_modified_by=user,
        deleted=False,
    ).exclude(
        title__startswith=OFFICE_TEMP_FILE_PREFIX,
        name__startswith=OFFICE_TEMP_FILE_PREFIX,
    ).first()


def handle_opened_or_closed_ms_office_file(instance, user, extension_query):
    # get the original file object
    original_file = get_original_file(instance, user)
    if original_file:
        # unlock here as the original has only been opened and is not being edited
        if original_file.has_lock():
            original_file.unlock()

        # cleanup trashed tmp files
        trashed_tmp_files = File.objects.all().filter(
            title__startswith=OFFICE_TEMP_FILE_PREFIX,
            name__startswith=OFFICE_TEMP_FILE_PREFIX,
            original_filename__startswith=OFFICE_TEMP_FILE_PREFIX,
            last_modified_by=user,
            deleted=True,
        )
        # filter for only files with ms office extensions
        trashed_tmp_files = trashed_tmp_files.filter(extension_query)
        for trashed_tmp_file in trashed_tmp_files:
            # delete temporary file without triggering anti-delete handler
            with disable_permission_checks(File):
                trashed_tmp_file.delete()

            # wait before deleting the next file, to avoid IO errors from slow storage devices
            sleep(2)


def handle_edited_ms_office_file(instance, user):
    # get the original file object
    original_file = get_original_file(instance, user)
    if original_file:
        # lock the original as it is being edited now
        original_file.lock()


def handle_saved_ms_office_file(instance, extension_query):
    # in this case the instance is the original file
    original_file = instance

    # find the current last save
    current_save = File.objects.all().filter(
        title__endswith='.tmp',
        last_modified_by=original_file.last_modified_by,
        deleted=False,
    ).filter(
        # the last_modified timestamp of the current save should be a bit greater than the original minus 10 seconds
        last_modified_at__gte=original_file.last_modified_at - timedelta(seconds=10),
    ).filter(
        # the last_modified timestamp of the current save should be a bit less than the original plus 10 seconds
        last_modified_at__lte=original_file.last_modified_at + timedelta(seconds=10),
    ).filter(extension_query).first()

    # if a current last save is found the sequence is started
    if current_save:
        logger.info("MS Office editing handling for original: {} with last save {} for user {}".format(
            original_file.name,
            current_save.name,
            original_file.last_modified_by,
        ))
        # set name, file_size and mime_type and untrash
        original_file.name = current_save.name
        original_file.file_size = current_save.file_size
        original_file.mime_type = current_save.mime_type
        original_file.deleted = False

        # create a new file with the content of the last save
        new_file = ContentFile(current_save.path.read())
        current_save.path.close()
        new_file.name = File.generate_file_name(original_file.name)
        new_file.name = os.path.relpath(new_file.name, settings.MEDIA_ROOT)

        # set the path to the new file
        original_file.path = new_file

        # create a new file entry for the new file, so we can have different files for different versions.
        uploaded_file_entry = UploadedFileEntry.objects.create(
            file=original_file,
            path=original_file.path,
            mime_type=original_file.mime_type,
            original_filename=original_file.name,
            file_size=original_file.file_size
        )
        # set the uploaded_file_entry to the new entry
        original_file.uploaded_file_entry = uploaded_file_entry

        # save the original
        original_file.save()

        # trash the last save, so we can delete it after
        current_save.trash()

        # sleep a second
        sleep(1)

        # delete the last save without triggering the anti-delete handler
        with disable_permission_checks(File):
            current_save.delete()


@receiver(post_save, sender=File)
def ms_office_cleanup_sequence(sender, instance, *args, **kwargs):
    """
    Detects when a MS Office File is edited in WebDav and starts a cleanup sequence that:
    1) When a file is just opened in MS Office the lock will be removed. Also a cleanup happens where
    unneeded tmp files are deleted
    2) When a file is being edited in MS Office the lock on the original will be set.
    3) When a file is saved in MS Office the original will be untrashed, a new file an entry will be created
    with the content of the last tmp save
    """
    # check if this is a file that can be cleaned up, if not just return before doing anything else
    if not has_ms_office_extension(instance.name):
        return

    # get the user of the request
    user = get_current_user()

    # get a list of Q queries with all extensions, that can later be used in filters.
    clauses = (Q(original_filename__endswith=extension) for extension in MS_OFFICE_EXTENSIONS)
    extension_query = reduce(operator.or_, clauses)

    # a file is opened or closed
    if instance.name.startswith(OFFICE_TEMP_FILE_PREFIX) and instance.deleted:
        handle_opened_or_closed_ms_office_file(instance, user, extension_query)

    # a file is being edited
    if instance.name.startswith(OFFICE_TEMP_FILE_PREFIX) and not instance.deleted:
        handle_edited_ms_office_file(instance, user)

    # a file is being saved by ms office
    if instance.name.endswith('.tmp') and instance.deleted:
        handle_saved_ms_office_file(instance, extension_query)
