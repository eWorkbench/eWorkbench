#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_changeset.models import RevisionModelMixin
from django_cleanhtmlfield.fields import HTMLField

from eric.core.models import BaseModel, LockMixin
from eric.core.models.abstract import SoftDeleteMixin, ChangeSetMixIn, WorkbenchEntityMixin
from eric.labbooks.models.managers import LabBookManager, LabBookChildElementManager, LabbookSectionManager
from eric.metadata.models.fields import MetadataRelation
from eric.metadata.models.models import Metadata
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.projects.models import Project
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin

logger = logging.getLogger(__name__)

User = get_user_model()

METADATA_VERSION_KEY = "metadata_version"
UNHANDLED_VERSION_ERROR = NotImplementedError("Unhandled metadata version")


class EntityMissingError(Exception):
    pass


class LabBook(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, LockMixin,
              ModelPrivilegeMixIn, WorkbenchEntityMixin):
    """
    Defines a LabBook, which can contain several other workbench elements as children
    """
    objects = LabBookManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("LabBook")
        verbose_name_plural = _("LabBooks")
        permissions = (
            ("trash_labbook", "Can trash a labbook"),
            ("restore_labbook", "Can restore a labbook"),
            ("change_project_labbook", "Can change the project of a labbook"),
            ("add_labbook_without_project", "Can add a labbook without a project")
        )
        track_fields = ('title', 'description', 'is_template', 'projects', 'deleted')
        track_related_many = (
            ('child_elements', ('position_x', 'position_y', 'width', 'height', 'child_object_content_type',
                                'child_object_id')),
            ('metadata', ('field', 'values',)),
        )
        fts_template = 'fts/labbook.html'
        export_template = 'export/labbook.html'

        def get_default_serializer(*args, **kwargs):
            from eric.labbooks.rest.serializers import LabBookSerializer
            return LabBookSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("Title of the labbook"),
        db_index=True
    )

    description = HTMLField(
        verbose_name=_("Description of the labbook"),
        blank=True,
        strip_unsafe=True,
    )

    is_template = models.BooleanField(
        default=False,
        verbose_name=_("Whether this labbook is a template or not")
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this labbook associated to"),
        related_name="labbooks",
        blank=True
    )

    metadata = MetadataRelation()

    def __str__(self):
        return self.title

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "title": self.title,
            "description": self.description,
            "is_template": self.is_template,
            "child_elements": [c.export_metadata() for c in self.child_elements.all()],
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
        self.description = metadata.get("description")
        self.is_template = metadata.get("is_template")

        self.projects.clear()
        self.child_elements.all().delete()

        section_elements = {}
        for child_metadata in metadata.get("child_elements"):
            try:
                element, section_child_elements = LabBookChildElement.create_from_metadata(child_metadata)
                element.save()
                if section_child_elements:
                    section_elements[element] = section_child_elements
            except EntityMissingError:
                pass  # ignore hard-deleted entities

        for section, child_element_pks in section_elements.items():
            elements = LabBookChildElement.objects.filter(
                child_object_id__in=child_element_pks
            )
            section.child_object.child_elements.add(*elements)

        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        Metadata.restore_all_from_entity(self, metadata.get("metadata"))


class LabBookChildElement(BaseModel, ChangeSetMixIn, RevisionModelMixin, LockMixin):
    """
    A LabBook Child Element, which has a generic foreign key a workbench element
    can be positioned within a lab_book with the following parameters:
    - position_x (grid x position)
    - position_y (grid y position)
    - width (width within the grid)
    - height (height within the grid)
    """
    objects = LabBookChildElementManager()

    class Meta:
        verbose_name = _("Child element of a labbook")
        verbose_name_plural = _("Child elements of a labbook")
        ordering = ('position_y', 'position_x',)
        track_fields = (
            'lab_book', 'position_x', 'position_y', 'width', 'height', 'child_object_content_type', 'child_object_id'
        )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    lab_book = models.ForeignKey(
        "labbooks.LabBook",
        verbose_name=_("Which labbook this element is a child of"),
        related_name="child_elements",
        on_delete=models.CASCADE
    )

    @property
    def relative_x_position(self):
        return self.position_x * 1450.0 / 30.0

    @property
    def relative_y_position(self):
        return self.position_y * 1450.0 / 30.0

    @property
    def relative_width(self):
        return self.width * 1440.0 / 30.0

    @property
    def relative_height(self):
        return self.height * 1440.0 / 30.0

    position_x = models.IntegerField(
        verbose_name=_("The x position of the labbook child element within the grid")
    )

    position_y = models.IntegerField(
        verbose_name=_("The y position of the labbook child element within the grid")
    )

    width = models.IntegerField(
        verbose_name=_("The width of the child element within the grid")
    )

    height = models.IntegerField(
        verbose_name=_("The height of the child element within the grid")
    )

    child_object_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name=_('ContentType of the child element'),
    )

    child_object_id = models.UUIDField(
        verbose_name=_('ID of the child element'),
    )

    child_object = GenericForeignKey('child_object_content_type', 'child_object_id')

    def __str__(self):
        return "Child Element at position {position_x},{position_y}".format(
            position_x=self.position_x,
            position_y=self.position_y
        )

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "lab_book_id": self.lab_book.pk,
            "position_x": self.position_x,
            "position_y": self.position_y,
            "width": self.width,
            "height": self.height,
            "child_object_content_type_id": self.child_object_content_type.pk,
            "child_object_id": self.child_object_id,
            "child_object_version_number": self.get_latest_child_version_number(),
        }

    def get_latest_child_version_number(self):
        from eric.versions.models.models import Version
        latest_version = Version.objects.filter(object_id=self.child_object_id).order_by('-number').first()
        # before exporting the metadata a version must be created for each sub-element,
        # therefore latest_version can never be null, as long as there is no programming mistake
        assert latest_version is not None
        return latest_version.number

    @classmethod
    def create_from_metadata(cls, metadata):
        version = metadata.get(METADATA_VERSION_KEY)
        if version == 1:
            return cls.__create_from_metadata_v1(metadata)
        else:
            raise UNHANDLED_VERSION_ERROR

    @classmethod
    def __create_from_metadata_v1(cls, metadata):
        element = LabBookChildElement(
            lab_book_id=metadata.get("lab_book_id"),
            position_x=metadata.get("position_x"),
            position_y=metadata.get("position_y"),
            width=metadata.get("width"),
            height=metadata.get("height"),
            child_object_content_type_id=metadata.get("child_object_content_type_id"),
            child_object_id=metadata.get("child_object_id"),
        )

        obj = element.child_object

        # escalate handling for hard-deleted elements
        if obj is None:
            raise EntityMissingError

        # restore trashed elements
        if obj.deleted:
            obj.restore()

        # restore section child elements
        section_child_elements = cls.__restore_child_object_to_version(obj, metadata.get("child_object_version_number"))

        return element, section_child_elements

    @staticmethod
    def __restore_child_object_to_version(child, version_number):
        from eric.versions.models.models import Version
        child_version = Version.objects.filter(object_id=child.pk).filter(number=version_number).first()
        section_child_elements = child.restore_metadata(child_version.metadata)
        child.save()

        return section_child_elements

    @property
    def is_labbook_section(self):
        """
        Checks if the LabBook child element is a LabbookSection
        returns: True or False
        """
        return self.child_object_content_type_id == LabbookSection.get_content_type().id


# TODO: Refactor to not use WorkbenchEntityMixin, ModelPrivilegeMixin, FTSMixin, RelationsMixIn
class LabbookSection(BaseModel, ChangeSetMixIn, RevisionModelMixin, LockMixin, SoftDeleteMixin, RelationsMixIn,
                     WorkbenchEntityMixin, ModelPrivilegeMixIn, FTSMixin):
    """ Defines a LabbookSection, which can be a labbook child element and hold other child elements"""
    objects = LabbookSectionManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = "LabbookSection"
        verbose_name_plural = "LabbookSections"
        ordering = ["date", "title"]
        track_fields = ("date", "title", "projects", "child_elements", "deleted")
        permissions = (
            ("trash_labbooksection", "Can trash a LabBook section"),
            ("restore_labbooksection", "Can restore a LabBook section"),
            ("change_project_labbooksection", "Can change the project of a LabBook section"),
            ("add_labbooksection_without_project", "Can add a LabBook section without a project")
        )
        is_relatable = False
        is_favouritable = False

        def get_default_serializer(*args, **kwargs):
            from eric.labbooks.rest.serializers import LabbookSectionSerializer
            return LabbookSectionSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    date = models.DateField(
        verbose_name=_("Date of the LabBook section")
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("Title of the LabBook section")
    )

    # reference to many projects (can be 0 projects, too)
    # needed so the Section elements are real WorkbenchEntity's, so locking WebSockets work and handlers don't error out
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this LabBook section associated to"),
        blank=True
    )

    # reference to many child_elements (can be 0 child_elements, too)
    # this is the only data we need so we can distinguish elements in the sections and not
    # show them in the top level labbook
    child_elements = models.ManyToManyField(
        "labbooks.LabBookChildElement",
        verbose_name=_("Which LabBookChildElements is this LabBook section associated to"),
        related_name="labbooksection",
        blank=True,
    )

    def __str__(self):
        return "LabbookSection {} {}".format(self.date, self.title)

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "date": self.date,
            "title": self.title,
            "projects": [p.pk for p in self.projects.all()],
            "child_elements": [c.child_object_id for c in self.child_elements.all()],
        }

    def restore_metadata(self, metadata):
        version = metadata.get(METADATA_VERSION_KEY)
        if version == 1:
            section_child_elements = self.__restore_metadata_v1(metadata)
            return section_child_elements
        else:
            raise UNHANDLED_VERSION_ERROR

    def __restore_metadata_v1(self, metadata):
        self.date = metadata.get("date")
        self.title = metadata.get("title")

        self.projects.clear()
        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        return metadata.get("child_elements")
