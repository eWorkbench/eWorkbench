#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

import json
import logging
import os
from collections import Counter
from contextlib import contextmanager
from datetime import timedelta
from hashlib import md5
from subprocess import check_output
from time import monotonic, sleep

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.template.loader import render_to_string
from django.test import RequestFactory
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from celery import shared_task
from django_userforeignkey.request import set_current_request

from eric._celery import app
from eric.core.models import disable_permission_checks
from eric.drives.models import Drive
from eric.dss.config import (
    CHECK_GLOBUS_RABBITMQ_QUEUE,
    DSS_MOUNT_PATH,
    ERROR_EMAIL_RECEIVER_CLIENT,
    ERROR_EMAIL_RECEIVER_INTERNAL,
    METADATA_FILE_NAME,
)
from eric.dss.helper_classes import DSSFileImport, DSSFileWatch
from eric.dss.models.models import DSSContainer, DSSFilesToImport
from eric.notifications.models import Notification, NotificationConfiguration
from eric.notifications.utils import send_mail
from eric.shared_elements.models import File
from eric.site_preferences.models import options as site_preferences

User = get_user_model()

logger = logging.getLogger(__name__)

LOCK_EXPIRE = 60 * 10  # Lock expires in 10 minutes


# this is a celery task lock that is used to prevent duplicate imports
# it works by setting a timeout and a lock in the cache, which will be removed after some time
@contextmanager
def dss_task_lock(lock_id, oid):
    timeout_at = monotonic() + LOCK_EXPIRE - 3
    logger.debug(f"timeout_at: {timeout_at}")
    # cache.add fails if the key already exists
    status = cache.add(lock_id, oid, LOCK_EXPIRE)
    try:
        yield status
    finally:
        if monotonic() < timeout_at and status:
            # don't release the lock if we exceeded the timeout
            # to lessen the chance of releasing an expired lock
            # owned by someone else
            # also don't release the lock if we didn't acquire it
            logger.debug(f"lock_id: {lock_id}")
            cache.delete(lock_id)


@shared_task
def import_dss_files():
    # gets the pks of all the paths to import that were 1) not already imported and 2) have not been tried to
    # be imported more than 3 times
    # The number of files to import in one batch can be limited by using slicing like [:1000].
    # Set the number according to testing
    files_to_import = DSSFilesToImport.objects.filter(
        imported=False,
        import_in_progress=False,
        import_attempts__lte=3,
    )[:1000]

    # We cannot use a simple .update() on the queryset here, as this 1. won't work with slices and
    # 2. only the count will the be returned and we lose access to the queryset.
    # That's why we loop here and save single items.
    for file_to_import in files_to_import:
        file_to_import.import_in_progress = True
        file_to_import.save()

    for file_to_import in files_to_import:
        file_to_import_hexdigest = md5(str(file_to_import.path).strip().encode()).hexdigest()
        lock_id = f"dss_task_lock-{file_to_import_hexdigest}"
        logger.info(f"Importing file: {file_to_import.path}")
        with dss_task_lock(lock_id, app.oid) as acquired:
            if acquired:
                try:
                    import_dss_file(file_to_import.path)
                except Exception as error:
                    logger.error(error)
                    pass
        logger.debug(f"File {file_to_import.path} is already being imported by another worker")


def set_request_for_user(user):
    """
    Sets the request context for a given system user.

    :param user: User object
    :return: Request context
    """
    request = RequestFactory().request(**{})
    setattr(request, "user", user)
    set_current_request(request)

    return request


@disable_permission_checks(DSSFilesToImport)
def import_dss_file(file_to_import_path):
    """
    Imports a single DSS file. Creates a DSSEnvelope, storage and directories, if required.
    """
    try:
        file_to_import = DSSFilesToImport.objects.get(path=file_to_import_path)
    except DSSFilesToImport.DoesNotExist:
        raise ValidationError(f'A DSSFilesToImport with the path of "{file_to_import_path}" does not exist.')
    except Exception as error:
        raise ValidationError(f'Error in import_dss_file() for DSSFilesToImport: "{file_to_import_path}": {error}')

    if file_to_import.imported:
        raise ValidationError(
            f"The file <{file_to_import.path}> was imported already at <{file_to_import.imported_at}>."
        )

    try:
        file_import = DSSFileImport(file_to_import)
        metadata_file = file_import.read_metadata_file()

        # set request user to user from metadata file
        # => so created_by, last_modified_by and ModelPrivileges are automatically set correctly
        set_request_for_user(metadata_file.load_user())

        with transaction.atomic():
            file_import.create_data(metadata_file)

    except Exception as error:
        file_to_import.last_import_attempt_failed = True
        file_to_import.last_import_attempt_failed_at = timezone.now()
        file_to_import.import_in_progress = False
        file_to_import.last_import_fail_reason = repr(error)
        raise
    else:
        file_to_import.last_import_attempt_failed = False
        file_to_import.imported = True
        file_to_import.import_in_progress = False
        file_to_import.imported_at = timezone.now()
    finally:
        file_to_import.import_attempts += 1
        file_to_import.save()


@shared_task
def scan_filesystem():
    # gets the containers with the setting "import_all" and adds the paths to DSSFilesToImport
    import_all = DSSContainer.IMPORT_ALL
    container_paths = (
        DSSContainer.objects.filter(
            import_option=import_all,
            deleted=False,
        )
        .values_list("path", flat=True)
        .order_by("created_at")
    )

    for container_path in container_paths:
        container_mount_path = os.path.join(DSS_MOUNT_PATH, container_path)
        container_path_hexdigest = md5(container_mount_path.strip().encode()).hexdigest()
        lock_id = f"dss_task_lock-{container_path_hexdigest}"
        logger.info(f"Scan the container path: {container_mount_path}")
        with dss_task_lock(lock_id, app.oid) as acquired:
            if acquired:
                scan_container_path_and_add_files_to_import(container_mount_path)
                sleep(2)
        logger.debug(f"Container path {container_mount_path} is already being scanned by another worker")


def scan_using_find(path):
    """Use the linux find command to get all the file paths within a path"""
    find_command = f"find {path} -type f 2>&1 | grep -v 'Permission denied'"
    return check_output(find_command, shell=True, timeout=360).decode("utf-8").splitlines()


def scan_container_path_and_add_files_to_import(container_path):
    """
    Scans a single container path for files and adds them to DSSFilesToImport
    """
    try:
        paths = scan_using_find(container_path)
        for path in paths:
            file_is_metadata = os.path.basename(path) == METADATA_FILE_NAME
            file_path = os.path.relpath(path, start=DSS_MOUNT_PATH)
            file_exists = File.objects.filter(path=file_path).exists()
            file_to_import_exists = DSSFilesToImport.objects.filter(path=path).exists()
            if not file_is_metadata and not file_exists and not file_to_import_exists:
                try:
                    DSSFilesToImport.objects.create(path=path)
                except Exception as error:
                    logger.error(error)
    except Exception as error:
        logger.error(error)


@shared_task
def send_dss_notifications_for_import_in_progress():
    """
    notifications:
        for curator
    """
    files_to_import_paths = (
        DSSFilesToImport.objects.filter(
            Q(
                import_in_progress=True,
            )
            | Q(
                import_in_progress=False,
                imported=False,
                import_attempts__lte=3,
            )
        )
        .values_list("path", flat=True)
        .order_by("path")
    )

    container_paths = []
    for file_to_import_path in files_to_import_paths:
        split = file_to_import_path.split("/")
        # Example: dssfs01/pr53ve/pr53ve-dss-0000
        container_path = "/".join(split[2:6])
        container_paths.append(container_path)

    container_paths = Counter(container_paths)

    content_type = DSSContainer.get_content_type()
    for container_path, count in container_paths.items():
        # send notification to container curator
        container = DSSContainer.objects.filter(path=container_path).first()
        title = _(f"DSS import in progress for {count} files in your container '{container.path}'")
        html_message = render_to_string("notification/dss_container.html", {"instance": container})
        dss_curator = container.created_by
        logger.info(f'Sending curator notification "{title}" to {dss_curator}')
        Notification.objects.create(
            user=dss_curator,
            title=title,
            message=html_message,
            content_type=content_type,
            object_id=container.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_DSS_IMPORT_IN_PROGRESS,
        )


@shared_task
def send_dss_notifications_for_import_finished():
    """
    notifications:
        import finished (count of dss_files, dss_storages) - for curator and user
    """
    delta = 60 * 30  # 30 minutes
    files_to_import_paths = (
        DSSFilesToImport.objects.filter(
            imported=True,
            import_in_progress=False,
            imported_at__gte=timezone.now() - timedelta(seconds=delta),
            imported_at__lte=timezone.now() + timedelta(seconds=1),
        )
        .values_list("path", flat=True)
        .order_by("path")
    )

    container_paths = []
    file_paths = []
    for file_to_import_path in files_to_import_paths:
        split = file_to_import_path.split("/")
        # Example: dssfs01/pr53ve/pr53ve-dss-0000
        container_path = "/".join(split[2:6])
        container_paths.append(container_path)
        # Example: dssfs01/pr53ve/pr53ve-dss-0000/envelope-p/storage-p/Auswahl_023.png
        file_path = "/".join(split[2:])
        file_paths.append(file_path)

    container_paths = Counter(container_paths)
    file_paths = Counter(file_paths).keys()

    content_type = DSSContainer.get_content_type()
    for container_path, count in container_paths.items():
        # send notification to container curator
        container = DSSContainer.objects.filter(path=container_path).first()
        title = _(f"DSS imported {count} files within the last {delta} seconds in your container '{container.path}'")
        html_message = render_to_string("notification/dss_container.html", {"instance": container})
        dss_curator = container.created_by
        logger.info(f'Sending curator notification "{title}" to {dss_curator}')
        Notification.objects.create(
            user=dss_curator,
            title=title,
            message=html_message,
            content_type=content_type,
            object_id=container.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_DSS_IMPORT_FINISHED,
        )

    file_path_users = {}
    for file_path in file_paths:
        file = File.objects.filter(path=file_path).first()
        if file.created_by not in file_path_users.keys():
            file_path_users[file.created_by] = (1, file.directory.drive)
        else:
            count = file_path_users[file.created_by][0] + 1
            file_path_users[file.created_by] = (count, file.directory.drive)

    content_type = Drive.get_content_type()
    for user, count_drive_list in file_path_users.items():
        count = count_drive_list[0]
        drive = count_drive_list[1]
        title = _(f"DSS imported {count} files within the last {delta} seconds in your storage '{drive.title}'")
        html_message = render_to_string("notification/dss_drive.html", {"instance": drive})
        logger.info(f'Sending user notification "{title}" to {user}')
        Notification.objects.create(
            user=user,
            title=title,
            message=html_message,
            content_type=content_type,
            object_id=drive.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_DSS_IMPORT_FINISHED,
        )


@shared_task
def send_dss_notifications_for_failed_imports():
    """
    notifications:
        errors - for curator and email to ERROR_EMAIL_RECEIVER_CLIENT
    """
    delta = 60 * 35  # 35 minutes
    files_to_import_paths = (
        DSSFilesToImport.objects.filter(
            imported=False,
            import_attempts__gte=4,
            last_import_attempt_failed=True,
            last_import_attempt_failed_at__gte=timezone.now() - timedelta(seconds=delta),
            last_import_attempt_failed_at__lte=timezone.now() + timedelta(seconds=1),
        )
        .values_list("path", "last_import_fail_reason")
        .order_by("path")
    )

    container_paths_and_fail_reasons = {}
    for file_to_import_path, file_to_import_path_fail_reason in files_to_import_paths:
        split = file_to_import_path.split("/")
        # Example: dssfs01/pr53ve/pr53ve-dss-0000
        container_path = "/".join(split[2:6])
        if container_path not in container_paths_and_fail_reasons.keys():
            container_paths_and_fail_reasons[container_path] = []
        if file_to_import_path_fail_reason not in container_paths_and_fail_reasons[container_path]:
            container_paths_and_fail_reasons[container_path].append(
                (file_to_import_path, file_to_import_path_fail_reason)
            )

    content_type = DSSContainer.get_content_type()
    for container, paths_and_reasons in container_paths_and_fail_reasons.items():
        # send notification to container curator
        container = DSSContainer.objects.filter(path=container).first()
        title = _(
            f"DSS import failed for {len(paths_and_reasons)} files within the last {delta} seconds in your "
            f"container '{container.path}'"
        )
        container.paths_and_reasons = paths_and_reasons
        html_message = render_to_string("notification/dss_container.html", {"instance": container})
        dss_curator = container.created_by
        logger.info(f'Sending curator notification "{title}" to {dss_curator}')
        Notification.objects.create(
            user=dss_curator,
            title=title,
            message=html_message,
            content_type=content_type,
            object_id=container.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_DSS_IMPORT_FAILED,
        )

        context = {
            "title": title,
            "message": html_message,
            "user": f"{dss_curator.first_name} {dss_curator.last_name}",
            "workbench_title": site_preferences.site_name,
        }
        html = render_to_string("email/single_notification_email.html", context)
        plaintext = render_to_string("email/single_notification_email.txt", context)
        logger.info(f'Sending curator email "{plaintext}" to {dss_curator.email}')
        send_mail(subject=title, message=plaintext, to_email=dss_curator.email, html_message=html)

        context = {
            "title": title,
            "message": html_message,
            "user": "Administrator",
            "workbench_title": site_preferences.site_name,
        }
        html = render_to_string("email/single_notification_email.html", context)
        plaintext = render_to_string("email/single_notification_email.txt", context)
        logger.info(f'Sending curator email "{plaintext}" to {ERROR_EMAIL_RECEIVER_CLIENT}')
        send_mail(subject=title, message=plaintext, to_email=ERROR_EMAIL_RECEIVER_CLIENT, html_message=html)


@shared_task
def globus_message_queue_consumer():
    """
    gets messages from the globus online rabbitmq message queue and adds the paths to DSSFilesToImport
    """
    if CHECK_GLOBUS_RABBITMQ_QUEUE:
        file_watch = None
        try:
            # Connecting to dssmq
            file_watch = DSSFileWatch()
            file_watch.setup_dssmq_connection()
            # Adding paths to DSSFilesToImport
            file_watch.post_files()
            # Close connection to dssmq
            file_watch.channel.close()
            file_watch.connection.close()
        except Exception as error:
            logger.error(error)
            title = _("Error in globus_message_queue_consumer()")
            plaintext = f"{error}"
            html = f"<p>{error}</p>"
            send_mail(subject=title, message=plaintext, to_email=ERROR_EMAIL_RECEIVER_INTERNAL, html_message=html)
            # Close connection to dssmq if they exist
            if file_watch.channel:
                file_watch.channel.close()
            if file_watch.connection:
                file_watch.connection.close()


@shared_task
def requeue_hanging_files_to_import():
    """
    If a FileToImport is still in progress and has not been imported, then set import_in_progress to false, so it is
    tried again in another import queue
    """
    delta = 60 * 60 * 3  # 3 hours
    hanging_files_to_import = DSSFilesToImport.objects.filter(
        import_in_progress=True,
        imported=False,
        import_attempts__lte=3,
        created_at__lte=timezone.now() - timedelta(seconds=delta),
    )
    if hanging_files_to_import:
        count = hanging_files_to_import.count()
        logger.info(f"Found {count} hanging files to requeue")
        with disable_permission_checks(DSSFilesToImport):
            hanging_files_to_import.update(import_in_progress=False)


@shared_task
def process_dir_metadata_etags():
    """
    Read idtags from dir_matadata.json files in directories and write the corresponding idtag into all File Descriptions
    """
    try:
        file_name = "dir_metadata.json"
        dir_metadata_files = File.objects.all().filter(name=file_name).distinct()
        for dir_metadata_file in dir_metadata_files:
            if dir_metadata_file.is_dss_file:
                idtag = ""
                with open(dir_metadata_file.path.path) as in_file:
                    dir_metadata_file_content = json.loads(in_file.read())
                for entry in dir_metadata_file_content:
                    if "idtag" in entry.keys():
                        idtag_id = entry["idtag"]
                        idtag = f"<p>idtag: {idtag_id}</p>"
                        logger.info(f"process_dir_metadata_etags IDTAG: {idtag}")
                with disable_permission_checks(File):
                    files_in_the_same_directory = (
                        File.objects.all().filter(directory=dir_metadata_file.directory).distinct()
                    )
                    logger.info(
                        f"process_dir_metadata_etags: Found {files_in_the_same_directory.count()} "
                        f"files in the same directory"
                    )
                    files_in_the_same_directory.update(description=idtag)
    except Exception as error:
        logger.error(error)
