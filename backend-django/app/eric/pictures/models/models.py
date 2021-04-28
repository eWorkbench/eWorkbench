#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import uuid

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO

import os
from django.conf import settings
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_changeset.models import RevisionModelMixin

from eric.core.models.abstract import ChangeSetMixIn, SoftDeleteMixin, WorkbenchEntityMixin, IsFavouriteMixin
from eric.core.models.base import BaseModel, LockMixin
from eric.core.models.utils import pk_or_none
from eric.metadata.models.fields import MetadataRelation
from eric.metadata.models.models import Metadata
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.pictures.models.managers import PictureManager
from eric.projects.models import FileSystemStorageLimitByUser, Project
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin
from eric.shared_elements.models import scramble_uploaded_filename

METADATA_VERSION_KEY = "metadata_version"
UNHANDLED_VERSION_ERROR = NotImplementedError("Unhandled metadata version")


def validate_file_is_json(value):
    """
    Validates that an uploaded file has the .json extension and contains json content
    :param value:
    :return:
    """
    # get extension
    ext = os.path.splitext(value.name)[1]
    if ext.lower() != ".json":
        raise ValidationError(_("File extension must be .json"))

    # open file and parse json
    try:
        value.file.seek(0)
        data = json.loads(value.file.read().decode("utf-8"))
    except:
        raise ValidationError(_("File must contain valid JSON"))


class Picture(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, LockMixin,
              ModelPrivilegeMixIn, WorkbenchEntityMixin, IsFavouriteMixin):
    """ Defines the workbench element Picture """
    objects = PictureManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("Picture")
        verbose_name_plural = _("Pictures")
        ordering = ["title"]
        permissions = (
            ("trash_picture", "Can trash a picture"),
            ("restore_picture", "Can restore a picture"),
            ("change_project_picture", "Can change the project of a picture"),
            ("add_picture_without_project", "Can add a picture without a project"),
        )
        track_fields = (
            'title', 'projects', 'width', 'height', 'deleted', 'rendered_image',
        )
        track_related_many = (
            ('metadata', ('field', 'values',)),
        )
        fts_template = 'fts/picture.html'
        export_template = 'export/picture.html'

        def get_default_serializer(*args, **kwargs):
            from eric.pictures.rest.serializers import PictureSerializer
            return PictureSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("Title of the picture")
    )

    width = models.IntegerField(
        default=512,
        verbose_name=_("Width of the picture in pixel")
    )

    height = models.IntegerField(
        default=512,
        verbose_name=_("Height of the picture in pixel")
    )

    background_image = models.ImageField(
        verbose_name=_("The background image of the picture"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser()
    )

    background_image_size = models.BigIntegerField(
        verbose_name=_("Size of the background image"),
        default=0
    )

    rendered_image = models.ImageField(
        verbose_name=_("The rendered image of the picture"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser()
    )

    rendered_image_size = models.BigIntegerField(
        verbose_name=_("Size of the rendered image"),
        default=0
    )

    shapes_image = models.FileField(
        verbose_name=_("The shapes of the image"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser()
    )

    shapes_image_size = models.BigIntegerField(
        verbose_name=_("Size of the background image"),
        default=0
    )

    uploaded_picture_entry = models.OneToOneField(
        'pictures.UploadedPictureEntry',
        verbose_name=_("Reference to the archived data"),
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='+'  # no reverse field, since there is one already
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this picture associated to"),
        related_name="pictures",
        blank=True
    )

    metadata = MetadataRelation()

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "title": self.title,
            "uploaded_picture_entry": pk_or_none(self.uploaded_picture_entry),
            "projects": [p.pk for p in self.projects.all()],
            "metadata": Metadata.export_all_from_entity(self),
        }

    def restore_metadata(self, metadata):
        version = metadata.get(METADATA_VERSION_KEY)
        if version == 1:
            self.__restore_metadata_v1(metadata)
        else:
            raise UNHANDLED_VERSION_ERROR

    def __restore_metadata_v1(self, metadata):
        self.title = metadata.get("title")

        picture_entry_pk = metadata.get("uploaded_picture_entry")
        if picture_entry_pk is not None and picture_entry_pk != '':
            self.restore_from_picture_entry(picture_entry_pk)

        self.projects.clear()
        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        Metadata.restore_all_from_entity(self, metadata.get("metadata"))

    def restore_from_picture_entry(self, picture_entry_pk):
        picture_entry = UploadedPictureEntry.objects.get(pk=picture_entry_pk)
        self.width = picture_entry.width
        self.height = picture_entry.height
        self.background_image = picture_entry.background_image
        self.background_image_size = picture_entry.background_image_size
        self.rendered_image = picture_entry.rendered_image
        self.rendered_image_size = picture_entry.rendered_image_size
        self.shapes_image = picture_entry.shapes_image
        self.shapes_image_size = picture_entry.shapes_image_size
        self.uploaded_picture_entry = picture_entry

    def __str__(self):
        return self.title

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        """
        Rename the uploaded file, make sure it is stored in the proper directory
        :param force_insert:
        :param force_update:
        :param using:
        :param update_fields:
        :return:
        """
        # create a new file if there is non sent, so there is a empty canvas
        if not self.background_image:
            image_file = BytesIO()
            image = Image.new('RGB', size=(512, 512), color=(255, 255, 255))
            image.save(image_file, 'png')
            self.background_image = SimpleUploadedFile('empty.png', image_file.read())

        do_store_new_picture_entry = False

        # check if shapes image file has changed
        if self.shapes_image and hasattr(self.shapes_image.file, 'content_type'):
            validate_file_is_json(self.shapes_image)
            do_store_new_picture_entry = True
            self.shapes_image.name = self.store_image_file(self.shapes_image)
            # store file size
            self.shapes_image_size = self.shapes_image.file.size

        # check if rendered image file has changed
        if self.rendered_image and hasattr(self.rendered_image.file, 'content_type'):
            do_store_new_picture_entry = True
            self.rendered_image.name = self.store_image_file(self.rendered_image)
            self.rendered_image_size = self.rendered_image.file.size

        # check if background image file has changed
        if self.background_image and hasattr(self.background_image.file, 'content_type'):
            do_store_new_picture_entry = True
            self.background_image.name = self.store_image_file(self.background_image)
            self.background_image_size = self.background_image.file.size

        if do_store_new_picture_entry:
            self.uploaded_picture_entry = self.create_uploaded_picture_entry()

        # check that some uploaded_picture_entry exists
        upload_failed = True
        try:
            if self.uploaded_picture_entry:
                upload_failed = False
        except ObjectDoesNotExist:
            pass
        if upload_failed:
            raise ValidationError(_('No file was uploaded'))

        super(Picture, self).save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields
        )

    def store_image_file(self, image):
        # rename shapes file
        new_name = scramble_uploaded_filename(image.name)
        new_path = settings.WORKBENCH_SETTINGS['project_file_upload_folder'] % {
            'filename': new_name
        }

        # create folder if it does not exist
        if not os.path.exists(os.path.dirname(new_path)):
            os.makedirs(os.path.dirname(new_path))

        # make sure the path we use is relative to the MEDIA_ROOT, we don't want to store the whole path
        new_path = os.path.relpath(new_path, settings.MEDIA_ROOT)
        return new_path

    def create_uploaded_picture_entry(self):
        entry = UploadedPictureEntry(
            picture=self,
            rendered_image=self.rendered_image,
            rendered_image_size=self.rendered_image_size,
            background_image=self.background_image,
            background_image_size=self.background_image_size,
            shapes_image=self.shapes_image,
            shapes_image_size=self.shapes_image_size,
            width=self.width,
            height=self.height
        )
        entry.save()
        return entry


class UploadedPictureEntry(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """
    An entry for uploaded files
    This entity is an additional storage of the the entity "Picture", such that one "Picture" can have multiple
    UploadedPictureEntry
    """

    class Meta:
        ordering = ['picture', 'id']
        track_fields = ('background_image', 'rendered_image', 'shapes_image',)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    picture = models.ForeignKey(
        'Picture',
        on_delete=models.CASCADE,
        verbose_name=_('Which picture this entry related to'),
        related_name='picture_entries'
    )

    background_image = models.ImageField(
        verbose_name=_("The background image of the picture"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser()
    )

    background_image_size = models.BigIntegerField(
        verbose_name=_("Size of the background image"),
        default=0
    )

    rendered_image = models.ImageField(
        verbose_name=_("The rendered image of the picture"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser()
    )

    rendered_image_size = models.BigIntegerField(
        verbose_name=_("Size of the rendered image"),
        default=0
    )

    shapes_image = models.FileField(
        verbose_name=_("The shapes of the image"),
        blank=True,
        null=True,
        max_length=512,
        storage=FileSystemStorageLimitByUser()
    )

    shapes_image_size = models.BigIntegerField(
        verbose_name=_("Size of the background image"),
        default=0
    )

    width = models.IntegerField(
        default=512,
        verbose_name=_("Width of the picture in pixel")
    )

    height = models.IntegerField(
        default=512,
        verbose_name=_("Height of the picture in pixel")
    )

    def __str__(self):
        return self.picture.title
