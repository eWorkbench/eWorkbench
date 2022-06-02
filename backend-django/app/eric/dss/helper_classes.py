#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import abc
import json
import logging
import mimetypes
import os
import ssl
from urllib.parse import unquote

import pika
from django.template.loader import render_to_string
from pika import exceptions as pika_exceptions

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models.signals import pre_save
from django.utils.translation import gettext_lazy as _

from eric.core.models import DisableSignal
from eric.drives.models import Directory, Drive
from eric.dss.config import DSS_MOUNT_PATH, METADATA_FILE_NAME, GLOBUS_RABBITMQ_HOST, \
    GLOBUS_RABBITMQ_PORT, GLOBUS_RABBITMQ_VIRTUAL_HOST, GLOBUS_RABBITMQ_QUEUE, GLOBUS_RABBITMQ_USER, \
    GLOBUS_RABBITMQ_PASSWORD, GLOBUS_RABBITMQ_SSL_CA_CERT, GLOBUS_RABBITMQ_MESSAGE_FETCH_SIZE
from eric.dss.models.handlers import check_directory_is_not_in_read_only_or_read_write_no_new_drive, \
    check_new_files_for_dss_container_read_write_settings,\
    check_drive_is_not_in_read_only_or_read_write_no_new_container
from eric.dss.models.models import DSSFilesToImport, DSSContainer, DSSEnvelope
from eric.dss.rest.serializers import DSSFilesToImportSerializer
from eric.metadata.models.models import MetadataField, Metadata
from eric.notifications.models import Notification, NotificationConfiguration
from eric.projects.models import Project
from eric.shared_elements.models import File, UploadedFileEntry

User = get_user_model()

logger = logging.getLogger(__name__)


class DSSURL:
    """ Represents a URL for DSS resources """

    def __init__(self, dss_path):
        """
        Example: /dss/dssfs01/ab12cd/ab12cd-dss-0000/env0123/stor-abc/export/data/raw/part1.tar.gz
        :param dss_path: /dss/<container-path (3 parts)>/<envelope>/<storage>/<directory-path>/<filename>
        """

        path_separator = os.sep

        self.path = dss_path
        self.path_parts = self.path.split(path_separator)

        if len(self.path_parts) < 7:
            raise ValidationError(f'Invalid import path <{self.path}>.')

        # DSS path parts
        # path_parts[0] is empty (path start with path separator)
        self.base_path = self.path_parts[1]
        self.container_path = path_separator.join(self.path_parts[2:5])
        self.envelope = self.path_parts[5]
        self.storage = self.path_parts[6]
        self.directories = self.path_parts[7:-1]
        self.file = self.path_parts[-1]

        # mount path in the workbench
        self.absolute_mount_path = os.path.join(DSS_MOUNT_PATH, self.path)


class MetadataFile(abc.ABC):
    """ Represents a metadata file of a DSS envelope. """

    def __init__(self):
        self.json_content = self.get_json_content()
        self.tum_id = self.json_content['tum_id']
        self.projects = self.json_content['projects']
        self.metadata_fields = self.json_content['metadata_fields']

    @abc.abstractmethod
    def get_json_content(self):
        raise NotImplementedError

    def load_user(self):
        user = User.objects.filter(username=self.tum_id).first()
        if not user:
            raise ValidationError(f'User <{self.tum_id}> does not exist.')

        return user


class MetadataFileFromFile(MetadataFile):
    """ Represents a metadata file that is read from an actual file. """

    def __init__(self, dss_url: DSSURL):
        self.dss_url = dss_url
        super().__init__()

    def get_json_content(self):
        file_path = os.path.join(
            DSS_MOUNT_PATH,
            self.dss_url.container_path,
            self.dss_url.envelope,
            METADATA_FILE_NAME,
        )
        with open(file_path, 'r') as metadata_file:
            return json.loads(metadata_file.read())


class MetadataFileFromEnvelopeModel(MetadataFile):
    """ Represents a metadatafile that is read from the database (envelope model). """

    def __init__(self, envelope):
        self.envelope = envelope
        super().__init__()

    def get_json_content(self):
        return self.envelope.metadata_file_content


class DSSFileImport:
    def __init__(self, file_to_import: DSSFilesToImport):
        # fully qualified DSS path, including container, storage, etc.
        # <container>/<envelope>/<storage>/<dirs>/<file>?
        self.dss_url = DSSURL(file_to_import.path)

    def read_metadata_file(self):
        container = self._load_container()
        envelope = DSSEnvelope.objects.filter(
            path=self.dss_url.envelope,
            container=container
        ).first()

        if envelope:
            metadata_file = MetadataFileFromEnvelopeModel(envelope)
        else:
            metadata_file = MetadataFileFromFile(self.dss_url)

        return metadata_file

    def validate_projects(self, projects_pks, container):
        valid_project_pks = []
        for project_pk in projects_pks:
            try:
                project = Project.objects.filter(pk=project_pk).editable().first()
                if project:
                    valid_project_pks.append(project.pk)
                else:
                    logger.debug(f'{project_pk} is not a valid and/or editable project that can be set')
                    self.send_project_fail_notification(container, project_pk)
            except Exception as error:
                logger.error(error)
                self.send_project_fail_notification(container, project_pk, error=error)

        return valid_project_pks

    @staticmethod
    def send_project_fail_notification(container, project_pk, error=None):
        if error:
            title = _(f"There was an error trying to set {project_pk} as a project: {error}")
            container.metadata_project_fail_error = error
        else:
            title = _(f"{project_pk} is not a valid and/or editable project that can be set")

        container.metadata_project_fail_pk = project_pk
        content_type = DSSContainer.get_content_type()
        html_message = render_to_string('notification/dss_container.html', {'instance': container})
        dss_curator = container.created_by
        logger.debug(f'Sending curator notification "{title}" to {dss_curator}')
        Notification.objects.get_or_create(
            user=dss_curator,
            title=title,
            message=html_message,
            content_type=content_type,
            object_id=container.pk,
            notification_type=NotificationConfiguration.NOTIFICATION_DSS_IMPORT_FAILED,
        )

    def create_data(self, metadata_file: MetadataFile):
        """ Imports the file and creates the envelope, storage, and directories, if necessary. """
        container = self._load_container()
        envelope, _ = DSSEnvelope.objects.get_or_create(
            path=self.dss_url.envelope,
            container=container,
            imported=True,
            defaults={
                'metadata_file_content': metadata_file.json_content,
            }
        )

        valid_projects = self.validate_projects(metadata_file.projects, container)

        metadata_fields = metadata_file.metadata_fields

        drive = self._get_or_create_drive(envelope, metadata_fields, projects=valid_projects)
        parent_directory = self._get_or_create_directories(drive)

        dir_metadata_json_idtag = self._get_dir_metadata_json_idtag(parent_directory)

        self._create_file(parent_directory, metadata_fields, projects=valid_projects,
                          dir_metadata_json_idtag=dir_metadata_json_idtag)

    def _load_container(self):
        container = DSSContainer.objects.filter(path=self.dss_url.container_path).first()
        if not container:
            raise ValidationError(f'Container <{self.dss_url.container_path}> does not exist.')

        return container

    def _get_or_create_drive(self, envelope: DSSEnvelope, metadata_fields, projects=None):
        with DisableSignal(pre_save, check_directory_is_not_in_read_only_or_read_write_no_new_drive, Directory), \
                DisableSignal(pre_save, check_drive_is_not_in_read_only_or_read_write_no_new_container, Drive):
            drive, drive_created = Drive.objects.get_or_create(
                envelope=envelope,
                title=self.dss_url.storage,
                defaults={
                    'imported': True
                }
            )

            if drive_created:
                if metadata_fields:
                    self._add_metadata(drive, metadata_fields)
                if projects:
                    try:
                        drive.projects.set(projects)
                    except Exception as error:
                        logger.error(error)

            return drive

    def _get_or_create_directories(self, drive: Drive):
        with DisableSignal(pre_save, check_directory_is_not_in_read_only_or_read_write_no_new_drive, Directory):
            root_directory = Directory.objects.filter(drive=drive, is_virtual_root=True).first()
            parent_directory = root_directory
            for current_directory_name in self.dss_url.directories:
                current_directory, directory_created = Directory.objects.get_or_create(
                    name=current_directory_name,
                    drive=drive,
                    directory=parent_directory,
                    imported=True,
                )

                parent_directory = current_directory

            return parent_directory

    def _get_dir_metadata_json_idtag(self, parent_directory: Directory):
        idtag = None

        full_directory_path = parent_directory.full_directory_path
        if full_directory_path.startswith("//"):
            full_directory_path = full_directory_path[2:]
        if full_directory_path.startswith("/"):
            full_directory_path = full_directory_path[1:]

        dir_metadata_path = os.path.join(
            DSS_MOUNT_PATH,
            self.dss_url.container_path,
            self.dss_url.envelope,
            self.dss_url.storage,
            full_directory_path,
            "dir_metadata.json",
        )
        if os.path.exists(dir_metadata_path):
            with open(dir_metadata_path, 'r') as dir_metadata_file:
                dir_metadata_file_content = json.loads(dir_metadata_file.read())

            for entry in dir_metadata_file_content:
                if "idtag" in entry.keys():
                    idtag_id = entry["idtag"]
                    idtag = f"<p>idtag: {idtag_id}</p>"
        return idtag

    def _create_file(self, parent_directory: Directory, metadata_fields, projects=None, dir_metadata_json_idtag=None):
        with DisableSignal(pre_save, check_new_files_for_dss_container_read_write_settings, File):
            dss_url = self.dss_url

            file, file_created = File.objects.get_or_create(
                name=dss_url.file,
                path=dss_url.path[5:],
                directory=parent_directory,
                file_size=os.path.getsize(dss_url.absolute_mount_path),
                original_filename=dss_url.file,
                defaults={
                    'imported': True,
                    'mime_type': mimetypes.guess_type(dss_url.file)[0] or File.DEFAULT_MIME_TYPE
                }
            )

            if file_created:
                uploaded_file_entry, uploaded_file_entry_created = UploadedFileEntry.objects.get_or_create(
                    file=file,
                    path=file.path,
                    mime_type=file.mime_type,
                    original_filename=file.name,
                    file_size=file.file_size
                )

                if uploaded_file_entry_created:
                    file.uploaded_file_entry = uploaded_file_entry
                    file.save()

                if metadata_fields:
                    self._add_metadata(file, metadata_fields)
                if projects:
                    try:
                        file.projects.set(projects)
                    except Exception as error:
                        logger.error(error)
                if dir_metadata_json_idtag:
                    try:
                        file.description = dir_metadata_json_idtag
                        file.save()
                    except Exception as error:
                        logger.error(error)

    @staticmethod
    def _add_metadata(obj, metadata_fields):
        for field in metadata_fields:
            field_pk = field['id']
            values = field['values']

            if not MetadataField.objects.filter(pk=field_pk).exists():
                raise ValidationError(f'MetadataField <{field_pk}> does not exist.')

            for value in values:
                Metadata.objects.create(
                    entity=obj,
                    field_id=field_pk,
                    values=value
                )


class DSSFileWatch:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.host = GLOBUS_RABBITMQ_HOST
        self.port = GLOBUS_RABBITMQ_PORT
        self.virtual_host = GLOBUS_RABBITMQ_VIRTUAL_HOST
        self.queue = GLOBUS_RABBITMQ_QUEUE
        self.user = GLOBUS_RABBITMQ_USER
        self.password = GLOBUS_RABBITMQ_PASSWORD
        self.ca_cert = GLOBUS_RABBITMQ_SSL_CA_CERT
        self.message_fetch_size = GLOBUS_RABBITMQ_MESSAGE_FETCH_SIZE

    def setup_dssmq_connection(self):
        context = ssl.create_default_context(cafile=self.ca_cert)
        context.verify_mode = ssl.CERT_REQUIRED
        credentials = pika.PlainCredentials(
            username=self.user,
            password=self.password,
            erase_on_connect=True
        )
        connection_parameters = pika.ConnectionParameters(
            host=self.host,
            port=self.port,
            virtual_host=self.virtual_host,
            credentials=credentials,
            heartbeat=0,
            ssl_options=pika.SSLOptions(context)
        )

        self._connect(connection_parameters)

    def _connect(self, connection_parameters):
        try:
            self.connection = pika.BlockingConnection(connection_parameters)
            self.channel = self.connection.channel()
        except pika_exceptions.ConnectionClosed:
            logger.error('Error connecting to {}'.format(self.host))

    def get_message_count(self):
        response = self.channel.queue_declare(
            queue=self.queue,
            passive=True,
            arguments={
                'x-queue-type': 'classic'
            })
        return response.method.message_count

    def get_n_messages(self, n):
        bodies = []
        delivery_tags = []

        for i in range(0, n):
            (method, header, body) = self.channel.basic_get(self.queue, auto_ack=False)

            bodies.append(body.decode('utf-8'))
            delivery_tags.append(method.delivery_tag)

        return bodies, delivery_tags

    @staticmethod
    def fix_messages(messages):
        fixed_messages = []
        for message in messages:
            message_dict = json.loads(message)
            for key, value in message_dict.items():
                path = value.replace("~/", "")
                # handle url encoded paths. "ab%20cd" becomes "ab cd" for example.
                path = unquote(path)
                fixed_message_dict = {"path": path}
                fixed_messages.append(fixed_message_dict)
        return fixed_messages

    def acknowledge_multiple_messages(self, delivery_tags):
        for delivery_tag in delivery_tags:
            self.channel.basic_ack(delivery_tag)

    def post_files(self):
        message_count = self.get_message_count()
        if message_count > 0:
            logger.info('The are {} pending messages in the dssmq'.format(message_count))
            if self.message_fetch_size < message_count:
                self.message_fetch_size = self.message_fetch_size
            else:
                self.message_fetch_size = message_count

            messages, delivery_tags = self.get_n_messages(self.message_fetch_size)

            # fix for messages
            messages = self.fix_messages(messages)

            serializer = DSSFilesToImportSerializer(data=messages, many=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            self.acknowledge_multiple_messages(delivery_tags)
        else:
            logger.info('The are no new messages in the dssmq')
