#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_changeset.models import RevisionModelMixin

from eric.core.models import BaseModel, LockMixin
from eric.core.models.abstract import ChangeSetMixIn, SoftDeleteMixin, WorkbenchEntityMixin, ImportedDSSMixin
from eric.dss.config import DSS_MOUNT_PATH
from eric.dss.models.managers import DSSEnvelopeManager, DSSContainerManager, DSSFilesToImportManager
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin

METADATA_VERSION_KEY = "metadata_version"
UNHANDLED_VERSION_ERROR = NotImplementedError("Unhandled metadata version")

logger = logging.getLogger(__name__)

# defines the root path for DSS files
dss_storage = FileSystemStorage(
    location=settings.DSS_SETTINGS['MOUNT_PATH'],
    base_url="/api/dssfiles"
)


# get the dynamic upload_to path for dss files
def get_upload_to_path(instance, filename):
    if instance.is_dss_file:
        if instance.__class__.__name__ == "UploadedFileEntry":
            directory = instance.file.directory
        else:
            directory = instance.directory
        drive = directory.drive
        envelope = drive.envelope
        container = envelope.container

        full_directory_path = directory.full_directory_path

        if full_directory_path.startswith("//"):
            full_directory_path = full_directory_path[2:]

        if full_directory_path.startswith("/"):
            full_directory_path = full_directory_path[1:]

        full_path = os.path.join(
            container.path,
            envelope.path,
            drive.title,
            full_directory_path,
            filename
        )

        return full_path
    else:
        return instance.path.name


# has drives and maps to a container
class DSSEnvelope(BaseModel, ChangeSetMixIn, RevisionModelMixin, ImportedDSSMixin):
    """ Defines a DSS envelope """
    objects = DSSEnvelopeManager()

    class Meta:
        verbose_name = _("DSS Envelope")
        verbose_name_plural = _("DSS Envelopes")
        track_fields = ('path', 'metadata_file_content',)
        ordering = ('path',)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    path = models.CharField(
        max_length=4096,
        verbose_name=_("Path of the DSS envelope")
    )

    metadata_file_content = models.JSONField(
        verbose_name=_("The JSON content of the metadata file within this envelope"),
        null=False,
        blank=True
    )

    container = models.ForeignKey(
        'DSSContainer',
        verbose_name=_("Which DSS Container this DSS Envelope is mapped to"),
        related_name='dss_envelopes',
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return self.path


# has envelopes
class DSSContainer(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, LockMixin,
                   ModelPrivilegeMixIn, WorkbenchEntityMixin):
    """ Defines a DSS container """
    objects = DSSContainerManager()

    # define read_write_setting types
    READ_ONLY = "RO"
    READ_WRITE_NO_NEW = "RWNN"
    READ_WRITE_ONLY_NEW = "RWON"
    READ_WRITE_ALL = "RWA"
    # define read_write_setting choices
    READ_WRITE_SETTING_CHOICES = (
        (READ_ONLY, "Read only"),
        (READ_WRITE_NO_NEW, "Read and write no new"),
        (READ_WRITE_ONLY_NEW, "Read and write only new"),
        (READ_WRITE_ALL, "Read and write all"),
    )

    # define import_option types
    IMPORT_ONLY_NEW = "ION"  # Import via API
    IMPORT_LIST = "IL"  # Manual import via file-list upload
    IMPORT_ALL = "IA"  # Import using file system scan
    # define import_option choices
    IMPORT_OPTION_CHOICES = (
        (IMPORT_ONLY_NEW, "Import only new"),
        (IMPORT_LIST, "Import list"),
        (IMPORT_ALL, "Import all"),
    )

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("DSS Container")
        verbose_name_plural = _("DSS Containers")
        ordering = ["name"]
        permissions = (
            ("trash_dsscontainer", "Can trash a DSS container"),
            ("restore_dsscontainer", "Can restore a DSS container"),
            ("change_project_dsscontainer", "Can change the project of a DSS container"),
            ("add_dsscontainer_without_project", "Can add a DSS container without a project")
        )
        track_fields = ('name', 'path', 'projects', 'deleted', 'read_write_setting', 'import_option')
        fts_template = 'fts/container.html'
        export_template = 'export/container.html'

        def get_default_serializer(*args, **kwargs):
            from eric.dss.rest.serializers import DSSContainerSerializer
            return DSSContainerSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=255,
        verbose_name=_("Name of the DSS container")
    )

    path = models.CharField(
        max_length=4096,
        verbose_name=_("Path of the DSS container"),
        unique=True
    )

    read_write_setting = models.CharField(
        max_length=4,
        choices=READ_WRITE_SETTING_CHOICES,
        default=READ_ONLY,
        verbose_name=_("Read and write settings for all envelopes within this container")
    )

    import_option = models.CharField(
        max_length=3,
        choices=IMPORT_OPTION_CHOICES,
        default=IMPORT_ONLY_NEW,
        verbose_name=_("Import options for envelopes within this container")
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this DSS container associated to"),
        related_name="dss_containers",
        blank=True
    )

    def __str__(self):
        return self.name

    def is_mounted(self):
        # if this is the docker development environment or the qabench for example we use os.path.exists as the
        # MOUNT_PATH is no real NFS mount in these environments, but only a normal file system path.
        if not settings.DSS_SETTINGS['CHECK_MOUNT_STATUS']:
            return os.path.exists(os.path.join(DSS_MOUNT_PATH, self.path))
        # otherwise on the live systems check if MOUNT_PATH is mounted
        return os.path.ismount(os.path.join(DSS_MOUNT_PATH, self.path))


class DSSFilesToImport(BaseModel):
    """ Defines DSS Files that should be imported """
    objects = DSSFilesToImportManager()

    class Meta:
        verbose_name = _("DSS File to import")
        verbose_name_plural = _("DSS Files to import")
        ordering = ('created_at',)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # Syntax:  /dss/<container-path>/<envelope>/<storage>/<directory-path>/<file>
    #
    # Example: /dss/dssfs03/tumdss/ab12cd/ab12cd-dss-0000/env0123/stor-abc/export/data/raw/part1.tar.gz
    #
    #   container-path: dssfs01/ab12cd/ab12cd-dss-0000/
    #   envelope:       env0123
    #   storage:        stor-abc
    #   directory-path: export/data/raw
    #   file:           part1.tar.gz
    path = models.CharField(
        max_length=4096,
        verbose_name=_("Path of the File to import"),
        unique=True,
        db_index=True
    )

    import_in_progress = models.BooleanField(
        verbose_name=_("Whether this DSS File is being imported at the moment"),
        default=False,
        db_index=True,
        blank=True
    )

    imported = models.BooleanField(
        verbose_name=_("Whether this DSS File has been imported"),
        default=False,
        db_index=True,
        blank=True
    )

    imported_at = models.DateTimeField(
        verbose_name=_("Date when this element was imported"),
        editable=False,
        null=True,
        blank=True,
        db_index=True,
    )

    import_attempts = models.IntegerField(
        default=0,
        verbose_name=_("The number of times the DSS Import was attempted for this path")
    )

    last_import_attempt_failed = models.BooleanField(
        verbose_name=_("Whether this DSS File to import has failed the last import attempt"),
        default=False,
        db_index=True,
        blank=True
    )

    last_import_attempt_failed_at = models.DateTimeField(
        verbose_name=_("Date of the last failed import attempt of the File to import"),
        editable=False,
        null=True,
        blank=True,
        db_index=True,
    )

    last_import_fail_reason = models.CharField(
        max_length=4096,
        verbose_name=_("Reason the last import attempt failed of the File to import"),
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        verbose_name=_("Date when this element was created"),
        auto_now_add=True,  # sets the date when the element is created
        editable=False,
        null=True,
        db_index=True,
    )

    last_modified_at = models.DateTimeField(
        verbose_name=_("Date when this element was last modified"),
        auto_now=True,  # sets the date every time the element is saved
        editable=False,
        null=True,
        db_index=True,
    )

    def __str__(self):
        return self.path

    @staticmethod
    def validate_path_is_within_dss_storage(path):
        """
        Validates that the path is within a dss storage
        :return:
        """
        path_is_incorrect = False
        # path should start with DSS_MOUNT_PATH (/dss)
        if not path.startswith(DSS_MOUNT_PATH):
            path_is_incorrect = True
        # split the path apart
        path_parts_list = path.split("/")
        # path_parts_list[0] should be an empty string as the first character of the path should be a "/"
        if not path_parts_list[0] == '':
            path_is_incorrect = True
        # path_parts_list[-1] should not be an empty string as that would mean the path is a directory and not a file
        if path_parts_list[-1] == '':
            path_is_incorrect = True
        # path_parts_list should at least contain 8 entries as the file is the within a storage or a subdirectory
        if len(path_parts_list) < 8:
            path_is_incorrect = True

        if path_is_incorrect:
            raise ValidationError({
                'path': ValidationError(
                    _('The path does not seem to be within a DSS storage'),
                    code='invalid'
                )
            })

    # this won't be called for requests over the api, as bulk_create is used in the serializers create() method
    def clean(self):
        self.validate_path_is_within_dss_storage(self.path)
