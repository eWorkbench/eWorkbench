#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import RegexValidator

from django_changeset.models import RevisionModelMixin

from eric.core.models.abstract import ChangeSetMixIn, SoftDeleteMixin, WorkbenchEntityMixin, OrderingModelMixin
from eric.core.models.base import BaseModel, LockMixin
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.projects.models import FileSystemStorageLimitByUser, scramble_uploaded_filename
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin
from eric.kanban_boards.models.managers import KanbanBoardManager, KanbanBoardColumnManager, \
    KanbanBoardColumnTaskAssignmentManager


rgba_color_validator = RegexValidator(
    r"^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$",
    _("Not a valid RGBA color")
)


class KanbanBoard(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, LockMixin,
                  ModelPrivilegeMixIn, WorkbenchEntityMixin):
    """ Defines the workbench element for Kanban Boards """
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
            'title', 'projects', 'deleted',
        )
        track_related_many = (
            ('kanban_board_columns', ('title', 'color', 'icon',)),
        )
        fts_template = 'fts/kanban_board.html'
        export_template = 'export/kanban_board.html'

        def get_default_serializer(*args, **kwargs):
            from eric.kanban_boards.rest.serializers import KanbanBoardSerializer
            return KanbanBoardSerializer

    KANBAN_BOARD_TYPE_PERSONAL = 'per'
    KANBAN_BOARD_TYPE_PROJECT = 'pro'

    KANBAN_BOARD_TYPE = (
        (KANBAN_BOARD_TYPE_PERSONAL, 'Personal'),
        (KANBAN_BOARD_TYPE_PROJECT, 'Project')
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("Title of the Kanban Board")
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this Kanban Board associated to"),
        related_name="kanban_boards",
        blank=True
    )

    board_type = models.CharField(
        max_length=3,
        choices=KANBAN_BOARD_TYPE,
        default=KANBAN_BOARD_TYPE_PROJECT,
        verbose_name=_("Type of the Kanban Board")
    )

    background_image = models.ImageField(
        verbose_name=_("The background image of the Kanban Board"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser()
    )

    background_image_size = models.BigIntegerField(
        verbose_name=_("Size of the background image"),
        default=0
    )

    background_image_thumbnail = models.ImageField(
        verbose_name=_("Thumbnail of the kanban board background image"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser()
    )

    background_color = models.CharField(
        max_length=30,
        verbose_name=_("RGBA color of the board"),
        validators=[rgba_color_validator],
        blank=True,
        null=True
    )

    def __str__(self):
        return self.title

    def create_thumbnail(self):

        from PIL import Image
        from io import BytesIO
        from django.core.files.base import ContentFile

        THUMB_SIZE = (460, 195, )

        image = Image.open(self.background_image)
        image.thumbnail(THUMB_SIZE, Image.ANTIALIAS)

        thumb_name, thumb_extension = os.path.splitext(self.background_image.name)
        thumb_extension = thumb_extension.lower()

        thumb_filename = thumb_name + '_thumb' + thumb_extension

        if thumb_extension in ['.jpg', '.jpeg']:
            FTYPE = 'JPEG'
        elif thumb_extension == '.gif':
            FTYPE = 'GIF'
        elif thumb_extension == '.png':
            FTYPE = 'PNG'
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
        if self.background_image and hasattr(self.background_image.file, 'content_type'):
            # rename shapes file
            new_background_image_file_name = scramble_uploaded_filename(self.background_image.name)

            new_background_image_file_path = settings.WORKBENCH_SETTINGS['project_file_upload_folder'] % {
                'filename': new_background_image_file_name
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
        super(KanbanBoard, self).save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields
        )


class KanbanBoardColumn(BaseModel, OrderingModelMixin, ChangeSetMixIn, RevisionModelMixin):
    """
    Defines a column for the kanban board
    """
    objects = KanbanBoardColumnManager()

    class Meta:
        verbose_name = _("Kanban Board Column")
        verbose_name_plural = _("Kanban Board Columns")
        ordering = ['ordering', 'title']
        track_fields = ('title', 'kanban_board', 'ordering', 'color', 'icon')

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("Title of the Kanban Board")
    )

    kanban_board = models.ForeignKey(
        'kanban_boards.KanbanBoard',
        related_name="kanban_board_columns",
        on_delete=models.SET_NULL,
        verbose_name=_("Which kanban board is this column assigned to"),
        blank=True,
        null=True
    )

    color = models.CharField(
        max_length=30,
        verbose_name=_("RGBA color of the column"),
        default="rgba(255,255,255,1)",  # white
        validators=[rgba_color_validator]
    )

    KANBAN_BOARD_COLUMN_ICONS = [
        ("fa fa-star", "New",),
        ("fa fa-spinner", "In Progress",),
        ("fa fa-check", "Done",),
        ("fa fa-pause", "Paused",),
        ("fa fa-times", "Canceled",),
        ("fa fa-book", "Documentation",),
        ("fa fa-truck", "Delivery",),
        ("fa fa-bars", "ToDo",),
        ("fa fa-bolt", "Testing", ),
        ("fa fa-code-fork", "Decision required", ),
        ("fa fa-flask", "Flask",),
        ("fa fa-question", "Question",),
    ]

    icon = models.CharField(
        max_length=64,
        choices=KANBAN_BOARD_COLUMN_ICONS,
        blank=True,
        default="",
        verbose_name=_("Icon of kanban board column")
    )

    tasks = models.ManyToManyField(
        'shared_elements.Task',
        through="KanbanBoardColumnTaskAssignment",
        verbose_name=_("The tasks of this column")
    )

    def __str__(self):
        return _("Kanban Board Column {} belonging to Board {}").format(
            self.title, self.kanban_board.title if self.kanban_board else '-'
        )


class KanbanBoardColumnTaskAssignment(BaseModel, OrderingModelMixin, ChangeSetMixIn, RevisionModelMixin):
    """
    Through table for many to many assignment of a Task / Kanban Board Column
    """
    objects = KanbanBoardColumnTaskAssignmentManager()

    class Meta:
        verbose_name = _("Kanban Board Column")
        verbose_name_plural = _("Kanban Board Columns")
        ordering = ['kanban_board_column__ordering', 'ordering']
        track_fields = ('kanban_board_column', 'ordering', 'task')

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    kanban_board_column = models.ForeignKey(
        KanbanBoardColumn,
        on_delete=models.CASCADE,
        related_name="kanban_board_column_task_assignments"
    )

    task = models.ForeignKey(
        'shared_elements.Task',
        on_delete=models.CASCADE
    )

    def validate_task_only_once_in_board(self):
        """
        Validates that the current assignment is unique, as in a task should only be assigned to a kanban board once
        This means no task can appear twice in the same kanban board
        :return:
        """
        qs = KanbanBoardColumnTaskAssignment.objects.filter(
            kanban_board_column__kanban_board=self.kanban_board_column.kanban_board,
            task=self.task
        ).exclude(
            pk=self.pk
        )

        if qs.exists():
            raise ValidationError(_('Task can only be added once to the current kanban board'))

    def clean(self):
        self.validate_task_only_once_in_board()

    def __str__(self):
        return _("Task {} is assigned to column {}").format(
            self.task, self.kanban_board_column.title
        )
