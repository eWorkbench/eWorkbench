#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import uuid

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Sum
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _

from django_changeset.models import RevisionModelMixin

from eric.core.models import BaseModel
from eric.core.models.abstract import (
    ChangeSetMixIn,
    ImportedDSSMixin,
    IsFavouriteMixin,
    SoftDeleteMixin,
    WorkbenchEntityMixin,
)
from eric.drives.models.managers import DirectoryManager, DriveManager
from eric.metadata.models.fields import MetadataRelation
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin

logger = logging.getLogger(__name__)

User = get_user_model()


class Directory(BaseModel, ChangeSetMixIn, RevisionModelMixin, ImportedDSSMixin):
    """
    Defines a Directory, which can contain other directories and files
    """

    objects = DirectoryManager()

    class Meta:
        verbose_name = _("Directory")
        verbose_name_plural = _("Directories")
        track_fields = (
            "name",
            "directory",
        )
        ordering = ("name",)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    def get_all_sub_directories(self):
        dir_pk_list = []
        dir_pk_list.append(str(self.pk))

        # get all sub directories
        sub_dirs = Directory.objects.filter(directory=self)

        for dir in sub_dirs:
            dir_pk_list += dir.get_all_sub_directories()

        return dir_pk_list

    @cached_property
    def file_size(self):
        """
        Returns the size of all files within that directory and its sub directories
        :return:
        """
        from eric.shared_elements.models import File

        # gather all files that are within this directory or its sub directories
        return File.objects.filter(directory__in=self.get_all_sub_directories()).aggregate(Sum("file_size"))[
            "file_size__sum"
        ]

    name = models.CharField(max_length=128, verbose_name=_("Title of the directory"))

    # parent directory
    directory = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name=_("Parent Directory"),
        related_name="sub_directories",
    )

    drive = models.ForeignKey(
        "drives.Drive",
        on_delete=models.CASCADE,
        verbose_name=_("Which Drive this directory is mapped to"),
        related_name="sub_directories",
    )

    is_virtual_root = models.BooleanField(
        verbose_name=_("Whether this directory is the virtual root directory of the current drive"),
        default=False,
        editable=False,
    )

    @cached_property
    def full_directory_path(self):
        """
        Returns the full directory path
        :return:
        """
        try:
            # try to access the parent directory
            return self.directory.full_directory_path + "/" + self.name
        except Exception:
            return self.name

    def get_direct_sub_directory_pks(self, all_directories):
        """
        Returns pks of all child directories from the all_directories list
        :param all_directories:
        :return:
        """
        children = []

        for directory in all_directories:
            if directory.directory and directory.directory_id == self.pk:
                # append current directory
                children.append(directory.pk)
                # and get all children of current directory
                children += directory.get_direct_sub_directory_pks(all_directories)

        return children

    @property
    def all_sub_directory_pks(self):
        """
        colelcts all sub directories and children of sub directories of the current directory
        :return:
        """
        # get all directories that are within the same drive
        dirs = Directory.objects.filter(drive=self.drive)

        pks_of_subdirectories = [self.pk]

        pks_of_subdirectories += self.get_direct_sub_directory_pks(dirs)

        return pks_of_subdirectories

    def __str__(self):
        return _("{}").format(self.name)

    def validate_circular_references(self):
        """
        Validates that the parent_directory can be set to the new value and that this does not cause circular references
        within the
        :return:
        """
        cur_directory = self
        while cur_directory.directory:
            if cur_directory.directory.pk == self.pk:
                raise ValidationError(
                    {
                        "directory": ValidationError(
                            _("Invalid parent folder %(directory)s - circular reference detected"),
                            params={"directory": self.directory},
                            code="invalid",
                        )
                    }
                )
            cur_directory = cur_directory.directory

    def validate_unique_title(self):
        """
        Validates that the title of the directory is unique (based on parent directory and drive)
        :return:
        """
        # wrap everything in a transaction because select_for_update() needs it
        with transaction.atomic():
            # select all directories that have the same drive and the same parent as select_for_update()
            all_dir_pks = (
                Directory.objects.all()
                .filter(drive=self.drive, directory=self.directory)
                .select_for_update()
                .values_list("id", flat=True)
            )

            # get all directories that are associated to the same drive and have the same parent directory
            dirs = (
                Directory.objects.all().filter(id__in=all_dir_pks, name__iexact=self.name).exclude(pk=self.pk)
            )  # exclude the current directory though!

            if dirs.exists():
                raise ValidationError(
                    {
                        "name": ValidationError(
                            _("Name must be unique within the same hierarchy"),
                            params={"name": self.name},
                            code="invalid",
                        )
                    }
                )

    def clean(self):
        """validates that a directory always has a parent directory"""
        self.validate_circular_references()
        self.validate_unique_title()


class Drive(
    BaseModel,
    ChangeSetMixIn,
    RevisionModelMixin,
    FTSMixin,
    SoftDeleteMixin,
    RelationsMixIn,
    ModelPrivilegeMixIn,
    WorkbenchEntityMixin,
    ImportedDSSMixin,
    IsFavouriteMixin,
):
    """
    Storage, previously known as Drive.
    Container for files and directories.
    """

    objects = DriveManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("Drive")
        verbose_name_plural = _("Drives")
        permissions = (
            ("trash_drive", "Can trash a drive"),
            ("restore_drive", "Can restore a drive"),
            ("change_project_drive", "Can change the project of a drive"),
            ("add_drive_without_project", "Can add a drive without a project"),
        )
        track_fields = (
            "title",
            "projects",
            "deleted",
        )
        track_related_many = (
            (
                "sub_directories",
                (
                    "name",
                    "directory",
                    "drive",
                ),
            ),
            (
                "metadata",
                (
                    "field",
                    "values",
                ),
            ),
        )
        fts_template = "fts/drive.html"
        export_template = "export/drive.html"

        def get_default_serializer(*args, **kwargs):
            from eric.drives.rest.serializers import DriveSerializer

            return DriveSerializer

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=128, verbose_name=_("Title of the drive"))

    envelope = models.ForeignKey(
        "dss.DSSEnvelope",
        on_delete=models.CASCADE,
        verbose_name=_("Which DSS Envelope this drive is mapped to"),
        related_name="drives",
        blank=True,
        null=True,
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        "projects.Project",
        verbose_name=_("Which projects is this drive associated to"),
        related_name="drives",
        blank=True,
    )

    metadata = MetadataRelation()

    @property
    def is_dss_drive(self):
        return bool(self.envelope)

    @property
    def location(self):
        if self.envelope and self.envelope.container:
            return f"DSS: {self.envelope.container.path}"
        else:
            return ""

    @cached_property
    def size(self):
        from eric.shared_elements.models import File

        return File.objects.filter(directory__drive=self).aggregate(Sum("file_size"))["file_size__sum"]

    def __str__(self):
        return _("{}").format(self.title)
