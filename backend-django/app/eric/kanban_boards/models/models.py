#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from django_changeset.models import RevisionModelMixin
from django_cleanhtmlfield.fields import HTMLField

from eric.core.models.abstract import (
    ChangeSetMixIn,
    IsFavouriteMixin,
    OrderingModelMixin,
    SoftDeleteMixin,
    WorkbenchEntityMixin,
)
from eric.core.models.base import BaseModel, LockMixin
from eric.core.utils import get_rgb_rgba_pattern
from eric.kanban_boards.models.managers import (
    KanbanBoardColumnManager,
    KanbanBoardColumnTaskAssignmentManager,
    KanbanBoardManager,
    KanbanBoardUserFilterSettingManager,
    KanbanBoardUserSettingManager,
)
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.projects.models import FileSystemStorageLimitByUser, scramble_uploaded_filename
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin

rgba_color_validator = RegexValidator(get_rgb_rgba_pattern(), _("Not a valid RGBA color"))


class KanbanBoard(
    BaseModel,
    ChangeSetMixIn,
    RevisionModelMixin,
    FTSMixin,
    SoftDeleteMixin,
    RelationsMixIn,
    LockMixin,
    ModelPrivilegeMixIn,
    WorkbenchEntityMixin,
    IsFavouriteMixin,
):
    """Defines the workbench element for Kanban Boards"""

    objects = KanbanBoardManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("Kanban Board")
        verbose_name_plural = _("Kanban Boards")
        ordering = ["title"]
        permissions = (
            ("trash_kanbanboard", "Can trash a Kanban Board"),
            ("restore_kanbanboard", "Can restore a Kanban Board"),
            ("change_project_kanbanboard", "Can change the project of a Kanban Board"),
            ("add_kanbanboard_without_project", "Can add a Kanban Board without a project"),
        )
        track_fields = (
            "title",
            "projects",
            "deleted",
        )
        track_related_many = (
            (
                "kanban_board_columns",
                (
                    "title",
                    "color",
                    "icon",
                ),
            ),
        )
        fts_template = "fts/kanban_board.html"
        export_template = "export/kanban_board.html"

        def get_default_serializer(*args, **kwargs):
            from eric.kanban_boards.rest.serializers import KanbanBoardSerializer

            return KanbanBoardSerializer

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=128, verbose_name=_("Title of the Kanban Board"), db_index=True)

    description = HTMLField(
        verbose_name=_("Description of the Kanban Board"),
        blank=True,
        strip_unsafe=True,
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        "projects.Project",
        verbose_name=_("Which projects is this Kanban Board associated to"),
        related_name="kanban_boards",
        blank=True,
    )

    background_image = models.ImageField(
        verbose_name=_("The background image of the Kanban Board"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser(),
    )

    background_image_size = models.BigIntegerField(verbose_name=_("Size of the background image"), default=0)

    background_image_thumbnail = models.ImageField(
        verbose_name=_("Thumbnail of the kanban board background image"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser(),
    )

    background_color = models.CharField(
        max_length=30,
        verbose_name=_("RGBA color of the board"),
        validators=[rgba_color_validator],
        blank=True,
        null=True,
    )

    def __str__(self):
        return self.title

    def create_thumbnail(self):

        from io import BytesIO

        from django.core.files.base import ContentFile

        from PIL import Image

        THUMB_SIZE = (
            460,
            195,
        )

        image = Image.open(self.background_image)
        image.thumbnail(THUMB_SIZE, Image.ANTIALIAS)

        thumb_name, thumb_extension = os.path.splitext(self.background_image.name)
        thumb_extension = thumb_extension.lower()

        thumb_filename = thumb_name + "_thumb" + thumb_extension

        if thumb_extension in [".jpg", ".jpeg"]:
            FTYPE = "JPEG"
        elif thumb_extension == ".gif":
            FTYPE = "GIF"
        elif thumb_extension == ".png":
            FTYPE = "PNG"
        else:
            return False  # Unrecognized file type

        # Save thumbnail to in-memory file as StringIO
        temp_thumb = BytesIO()
        image.save(temp_thumb, FTYPE)
        temp_thumb.seek(0)

        # set save=False, otherwise it will run in an infinite loop
        self.background_image_thumbnail.save(thumb_filename, ContentFile(temp_thumb.read()), save=False)
        temp_thumb.close()

        return True

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        """
        Rename the uploaded file, make sure it is stored in the proper directory
        :param force_insert:
        :param force_update:
        :param using:
        :param update_fields:
        :return:
        """
        # check if rendered image file has changed
        if self.background_image and hasattr(self.background_image.file, "content_type"):
            # rename shapes file
            new_background_image_file_name = scramble_uploaded_filename(self.background_image.name)

            new_background_image_file_path = settings.WORKBENCH_SETTINGS["project_file_upload_folder"] % {
                "filename": new_background_image_file_name
            }

            # create folder if it does not exist
            if not os.path.exists(os.path.dirname(new_background_image_file_path)):
                os.makedirs(os.path.dirname(new_background_image_file_path))

            # make sure the path we use is relative to the MEDIA_ROOT, we dont want to store the whole path
            new_background_image_file_path = os.path.relpath(new_background_image_file_path, settings.MEDIA_ROOT)

            self.background_image.name = new_background_image_file_path
            # store file size
            self.background_image_size = self.background_image.file.size

            # also generate thumbnail image here
            self.create_thumbnail()

        # call super method
        super().save(force_insert=force_insert, force_update=force_update, using=using, update_fields=update_fields)


class KanbanBoardColumn(BaseModel, OrderingModelMixin, ChangeSetMixIn, RevisionModelMixin):
    """
    Defines a column for the kanban board
    """

    objects = KanbanBoardColumnManager()

    class Meta:
        verbose_name = _("Kanban Board Column")
        verbose_name_plural = _("Kanban Board Columns")
        ordering = ["ordering", "title"]
        track_fields = ("title", "kanban_board", "ordering", "color", "icon")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=128, verbose_name=_("Title of the Kanban Board"))

    kanban_board = models.ForeignKey(
        "kanban_boards.KanbanBoard",
        related_name="kanban_board_columns",
        on_delete=models.SET_NULL,
        verbose_name=_("Which kanban board is this column assigned to"),
        blank=True,
        null=True,
    )

    color = models.CharField(
        max_length=30,
        verbose_name=_("RGBA color of the column"),
        default="rgba(244,244,244,1)",
        validators=[rgba_color_validator],
    )

    KANBAN_BOARD_COLUMN_ICONS = [
        (
            "fa fa-star",
            "New",
        ),
        (
            "fa fa-spinner",
            "In Progress",
        ),
        (
            "fa fa-check",
            "Done",
        ),
        (
            "fa fa-pause",
            "Paused",
        ),
        (
            "fa fa-times",
            "Canceled",
        ),
        (
            "fa fa-book",
            "Documentation",
        ),
        (
            "fa fa-truck",
            "Delivery",
        ),
        (
            "fa fa-bars",
            "ToDo",
        ),
        (
            "fa fa-bolt",
            "Testing",
        ),
        (
            "fa fa-code-fork",
            "Decision required",
        ),
        (
            "fa fa-flask",
            "Flask",
        ),
        (
            "fa fa-question",
            "Question",
        ),
    ]

    icon = models.CharField(
        max_length=64,
        choices=KANBAN_BOARD_COLUMN_ICONS,
        blank=True,
        default="",
        verbose_name=_("Icon of kanban board column"),
    )

    tasks = models.ManyToManyField(
        "shared_elements.Task", through="KanbanBoardColumnTaskAssignment", verbose_name=_("The tasks of this column")
    )

    def __str__(self):
        return _("Kanban Board Column {} belonging to Board {}").format(
            self.title, self.kanban_board.title if self.kanban_board else "-"
        )


class KanbanBoardColumnTaskAssignment(BaseModel, OrderingModelMixin, ChangeSetMixIn, RevisionModelMixin):
    """
    Through table for many to many assignment of a Task / Kanban Board Column
    """

    objects = KanbanBoardColumnTaskAssignmentManager()

    class Meta:
        verbose_name = _("Kanban Board Column")
        verbose_name_plural = _("Kanban Board Columns")
        ordering = ["kanban_board_column__ordering", "ordering"]
        track_fields = ("kanban_board_column", "ordering", "task")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    kanban_board_column = models.ForeignKey(
        KanbanBoardColumn, on_delete=models.CASCADE, related_name="kanban_board_column_task_assignments"
    )

    task = models.ForeignKey("shared_elements.Task", on_delete=models.CASCADE)

    def validate_task_only_once_in_board(self):
        """
        Validates that the current assignment is unique, as in a task should only be assigned to a kanban board once
        This means no task can appear twice in the same kanban board
        :return:
        """
        qs = KanbanBoardColumnTaskAssignment.objects.filter(
            kanban_board_column__kanban_board=self.kanban_board_column.kanban_board, task=self.task
        ).exclude(pk=self.pk)

        if qs.exists():
            raise ValidationError(_("Task can only be added once to the current kanban board"))

    def clean(self):
        self.validate_task_only_once_in_board()

    def __str__(self):
        return _("Task {} is assigned to column {}").format(self.task, self.kanban_board_column.title)


class KanbanBoardUserFilterSetting(BaseModel):
    """
    Through table for many to many filter setting of a User to a TaskBoard
    """

    objects = KanbanBoardUserFilterSettingManager()

    class Meta:
        verbose_name = _("Kanban Board User Filter Setting")
        verbose_name_plural = _("Kanban Board User Filter Settings")
        track_fields = ("kanban_board", "user")
        index_together = (
            (
                "kanban_board",
                "user",
            ),
        )
        unique_together = (
            (
                "kanban_board",
                "user",
            ),
        )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    kanban_board = models.ForeignKey(
        "kanban_boards.KanbanBoard",
        related_name="kanban_board_user_filter_settings",
        on_delete=models.CASCADE,
        verbose_name=_("Which kanban board is this user filter setting for"),
    )

    user = models.ForeignKey(
        get_user_model(),
        verbose_name=_("User"),
        on_delete=models.CASCADE,
    )

    settings = models.JSONField(
        verbose_name=_("Kanban Board User Filter Settings"),
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
        return f"TaskBoard User Filter Setting of TaskBoard {self.kanban_board} for User {self.user}"


class KanbanBoardUserSetting(BaseModel):
    """
    Through table for many to many filter setting of a User to a TaskBoard
    """

    objects = KanbanBoardUserSettingManager()

    class Meta:
        verbose_name = _("Kanban Board User Setting")
        verbose_name_plural = _("Kanban Board User Settings")
        track_fields = ("kanban_board", "user")
        index_together = (
            (
                "kanban_board",
                "user",
            ),
        )
        unique_together = (
            (
                "kanban_board",
                "user",
            ),
        )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    kanban_board = models.ForeignKey(
        "kanban_boards.KanbanBoard",
        related_name="kanban_board_user_settings",
        on_delete=models.CASCADE,
        verbose_name=_("Which kanban board is this user setting for"),
    )

    user = models.ForeignKey(
        get_user_model(),
        verbose_name=_("User"),
        on_delete=models.CASCADE,
    )

    restrict_task_information = models.BooleanField(
        verbose_name=_("Whether the task information should be restricted in this Kanban Board"),
        default=False,
        db_index=True,
    )

    day_indication = models.BooleanField(
        verbose_name=_("Whether the day indications for this Kanban Board should be shown"),
        default=False,
        db_index=True,
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
        return f"TaskBoard User Setting of TaskBoard {self.kanban_board} for User {self.user}"
