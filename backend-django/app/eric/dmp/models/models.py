#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from ckeditor.fields import RichTextField
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from django_changeset.models import RevisionModelMixin
from django_cleanhtmlfield.fields import HTMLField
from django_userforeignkey.request import get_current_user

from eric.base64_image_extraction.models import ExtractedImage
from eric.core.models import BaseModel, LockMixin, disable_permission_checks
from eric.core.models.abstract import OrderingModelMixin, SoftDeleteMixin, ChangeSetMixIn, WorkbenchEntityMixin, \
    IsFavouriteMixin
from eric.dmp.models.managers import DmpManager, DmpFormDataManager, DmpFormFieldManager, DmpFormManager
from eric.metadata.models.fields import MetadataRelation
from eric.metadata.models.models import Metadata
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.projects.models import Project
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin

METADATA_VERSION_KEY = "metadata_version"
UNHANDLED_VERSION_ERROR = NotImplementedError("Unhandled metadata version")


class Dmp(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, LockMixin,
          ModelPrivilegeMixIn, WorkbenchEntityMixin, IsFavouriteMixin):
    """ Defines a DMP, which is associated to a project and a DMP Form """

    objects = DmpManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("DMP")
        verbose_name_plural = _("DMPs")
        ordering = ["title", "status"]
        permissions = (
            ("trash_dmp", "Can trash a dmp"),
            ("restore_dmp", "Can restore a dmp"),
            ("add_dmp_without_project", "Can add a dmp without a project")
        )
        track_fields = ('title', 'status', 'projects', 'dmp_form', 'deleted')
        track_related_many = (
            ('dmp_form_data', ('pk', 'name', 'value',)),
            ('metadata', ('field', 'values',)),
        )
        fts_template = 'fts/dmp.html'
        export_template = 'export/export_pdf.html'

        def get_default_serializer(*args, **kwargs):
            from eric.dmp.rest.serializers import DmpSerializerExtended
            return DmpSerializerExtended

    # DMP Status Choices
    NEW = 'NEW'
    PROGRESS = 'PROG'
    FINAL = 'FIN'
    DMP_STATUS_CHOICES = (
        (NEW, 'New'),
        (PROGRESS, 'In Progress'),
        (FINAL, 'Final')
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("title of the dmp")
    )

    status = models.CharField(
        max_length=5,
        choices=DMP_STATUS_CHOICES,
        verbose_name=_("Status of the Dmp"),
        default=NEW
    )

    dmp_form = models.ForeignKey(
        'DmpForm',
        verbose_name=_("Which dmp form is this dmp associated to"),
        related_name="dmps",
        on_delete=models.CASCADE
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this dmp associated to"),
        related_name="dmps"
    )

    metadata = MetadataRelation()

    def __str__(self):
        return self.title

    def prevent_dmp_form_change(self):
        """
        checks if the dmp exists before or not. It is only created when it does not exist.
        """

        # check if object exists (= update) or if it does not exist (= create)
        dmp_object = Dmp.objects.filter(id=self.pk).first()
        if not dmp_object:
            # on create --> no need to do anything
            return

        # else: it's an update, check that dmp_form has not changed
        if dmp_object.dmp_form_id != self.dmp_form_id:
            raise ValidationError({
                'dmp_form': ValidationError(
                    _('You are not allowed to change the dmp form'),
                    params={'dmp': self},
                    code='invalid'
                )
            })

            # check if the status is set to FINAL and the user is not the creator
            # True --> DMP Form Data can not be changed
            # False --> DMP From Data can be
        if dmp_object.status == Dmp.FINAL and dmp_object.created_by != get_current_user():
            raise ValidationError({
                'status': ValidationError(
                    _('Once the status is set to final, updates are only allowed by the user that created the DMP.'),
                    params={'dmp': self},
                    code='invalid'
                )
            })

    def clean(self):
        self.prevent_dmp_form_change()

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        # the DMP form can not change, therefore we just have to store the values
        return {
            METADATA_VERSION_KEY: 1,
            "title": self.title,
            "status": self.status,
            "field_data": [data.export_metadata() for data in self.dmp_form_data.all()],
            "projects": [project.pk for project in self.projects.all()],
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
        self.status = metadata.get("status")

        self.projects.clear()

        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        form_pk = metadata.get("form_pk")
        if form_pk is not None:
            self.dmp_form_id = form_pk

        with disable_permission_checks(DmpFormData):
            self.dmp_form_data.all().delete()

            for field_data_metadata in metadata.get("field_data"):
                data = DmpFormData.create_from_metadata(field_data_metadata)
                data.save()

        Metadata.restore_all_from_entity(self, metadata.get("metadata"))

    def duplicate(self, *args, **kwargs):
        """
        Duplicates the DMP and removes all non-relevant variables (such as Django ChangeSet __original_data__)
        """

        from django.forms import model_to_dict
        dmp_dict = model_to_dict(self)
        metadata = kwargs.get('metadata', [])

        old_dmp_pk = kwargs['old_dmp_pk']
        del kwargs['old_dmp_pk']

        # duplicated DMP should not be soft deleted even if the original project is
        del dmp_dict['deleted']

        # variables are generated automatically
        del dmp_dict['version_number']
        del dmp_dict['fts_language']

        # updates the DMP dict (e.g. name or parent pk should be changed in the duplicated object)
        dmp_dict.update(kwargs)

        # related projects will be added separately after the duplicated DMP has been saved
        del dmp_dict['projects']
        del dmp_dict['metadata']

        # create a new project object and save it
        new_dmp_object = Dmp(**dmp_dict)
        new_dmp_object.save()
        new_dmp_object.projects.set(kwargs.get('projects', []))
        if metadata:
            new_dmp_object.metadata.set(metadata)

        # Duplicate all answers too. Firstly, we must find all for data fields for the old DMP.
        # After that we must somehow map the old data field PK to the new one. However, this is not possible.
        # The DMP for data fields will be automatically created by a post_save handler, so we don't have access to
        # the PKs. But since this is a duplication, we can map the type, the name and the ordering. Actually, mapping
        # the ordering should be enough but we don't know if the ordering of the old DMP was correct. The additional
        # mapping of type and name helps with that matter if the fields would have had the same ordering number.
        for old_data in DmpFormData.objects.viewable().filter(dmp__pk=old_dmp_pk):
            new_data = DmpFormData.objects.get(
                dmp__pk=new_dmp_object.pk, type=old_data.type, name=old_data.name, ordering=old_data.ordering
            )

            if new_data:
                new_data.value = old_data.value
                new_data.save()

        return new_dmp_object


@receiver(post_save, sender=Dmp)
def on_dmp_create_create_form_data_for_the_specific_dmp_form(instance, raw, created, *args, **kwargs):
    """
        When a new dmp is created, copy specific dmp form fields because of the selected dmp form to dmp form data.
    """
    if raw or not created:
        return

    dmp_form_field_list = DmpFormField.objects.filter(dmp_form=instance.dmp_form.id)

    dmp_form_data_objects = []

    # for each dmp_form_field create a new DmpFormData for the current dmp instance
    for dmp_form_field in dmp_form_field_list:
        # create a new dmp form data object
        dmp_form_data_object = DmpFormData()
        # copy field name, type, infotext
        dmp_form_data_object.name = dmp_form_field.name
        dmp_form_data_object.type = dmp_form_field.type
        dmp_form_data_object.infotext = dmp_form_field.infotext
        dmp_form_data_object.dmp_form_field = dmp_form_field
        dmp_form_data_object.ordering = dmp_form_field.ordering
        # set current dmp instance
        dmp_form_data_object.dmp = instance

        dmp_form_data_objects.append(dmp_form_data_object)

    # bulk create the form data objects
    DmpFormData.objects.bulk_create(dmp_form_data_objects)


class DmpForm(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """ Defines a dmp form with a title and a description """

    objects = DmpFormManager()

    class Meta:
        verbose_name = _("DMP Form")
        verbose_name_plural = _("DMP Forms")
        ordering = ["title"]
        track_fields = ('title', 'description')

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("title of the dmp form")
    )
    description = models.TextField(
        verbose_name=_("description of the dmp form")
    )

    def __str__(self):
        return _("DMP Form %(title)s") % {'title': self.title}


class DmpFormField(BaseModel, OrderingModelMixin, ChangeSetMixIn, RevisionModelMixin):
    """ Defines DMP form field, which are associated to a DMP Form"""

    objects = DmpFormFieldManager()

    class Meta:
        verbose_name = _("DMP Form Field")
        verbose_name_plural = _("DMP Form Fields")
        ordering = ["ordering", "name", "type"]
        track_fields = ('name', 'type', 'infotext', 'dmp_form',)

    # DMP Form Field Choices
    TEXTFIELD = 'TXF'
    TEXTAREA = 'TXA'
    NUMBER = 'NUM'
    DMP_FORM_FIELD_CHOICES = (
        (TEXTFIELD, 'Textfield'),
        (TEXTAREA, 'Textarea'),
        (NUMBER, 'Number')
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=128,
        verbose_name=_("name of the dmp form field")
    )
    type = models.CharField(
        max_length=5,
        verbose_name=_("type of the dmp form field"),
        choices=DMP_FORM_FIELD_CHOICES,
        default=TEXTFIELD
    )
    infotext = RichTextField(
        config_name='awesome_ckeditor',
        verbose_name=_("infotext of the dmp form field"),
    )

    dmp_form = models.ForeignKey(
        'DmpForm',
        verbose_name=_("Which dmp form is this dmp form field associated to"),
        related_name="dmp_form_fields",
        on_delete=models.CASCADE
    )

    def __str__(self):
        return _("DMP Form Field %(name)s (%(type)s)") % {'name': self.name, 'type': self.type}


class DmpFormData(BaseModel, OrderingModelMixin, ChangeSetMixIn, RevisionModelMixin):
    """ Defines DMP form data, which is associated to a DMP and a DMP form field"""

    objects = DmpFormDataManager()

    class Meta:
        verbose_name = _("DMP Form Data")
        verbose_name_plural = _("DMP Form Data")
        ordering = ["ordering", "name", "type"]
        track_fields = ('value', 'name', 'type', 'infotext', 'dmp', 'dmp_form_field',)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    value = HTMLField(
        verbose_name=_("value of the dmp form data"),
        blank=True
    )

    name = models.CharField(
        max_length=128,
        verbose_name=_("name of the dmp form data")
    )

    type = models.CharField(
        max_length=5,
        verbose_name=_("type of the dmp form data"),
        choices=DmpFormField.DMP_FORM_FIELD_CHOICES,
        default=DmpFormField.TEXTFIELD
    )

    infotext = models.TextField(
        verbose_name=_("infotext of the dmp form data")
    )

    dmp = models.ForeignKey(
        'Dmp',
        verbose_name=_("Which dmp is this dmp form data associated to"),
        related_name="dmp_form_data",
        on_delete=models.CASCADE
    )

    dmp_form_field = models.ForeignKey(
        'DmpFormField',
        verbose_name=_("Which dmp form field is this dmp form data associated to"),
        related_name="dmp_form_data",
        on_delete=models.CASCADE
    )

    extracted_images = GenericRelation(ExtractedImage)

    def __str__(self):
        return _("DMP Form Data %(name)s (%(type)s)") % {'name': self.name, 'type': self.type}

    def infotext_display_html(self):
        """
            displays the text form infotext in html
        """
        return format_html(self.infotext)

    def checks_value_field_data(self):
        """
            checks if the value from the dmp value field is an number when the type field was set to a number
        """
        if self.type == DmpFormField.NUMBER and self.value:
            try:
                # try parsing the value
                int(self.value)
            except ValueError:
                raise ValidationError({
                    'value': ValidationError(
                        _('The value has to be a number'),
                        params={'dmp': self},
                        code='invalid'
                    )
                })

    def clean(self):
        self.checks_value_field_data()

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "name": self.name,
            "type": self.type,
            "value": self.value,
            "info_text": self.infotext,
            "dmp_pk": self.dmp_id,
            "dmp_form_field_pk": self.dmp_form_field_id
        }

    @classmethod
    def create_from_metadata(cls, metadata):
        version = metadata.get(METADATA_VERSION_KEY)
        if version == 1:
            return cls.__create_from_metadata_v1(metadata)
        else:
            raise UNHANDLED_VERSION_ERROR

    @classmethod
    def __create_from_metadata_v1(cls, metadata):
        return DmpFormData(
            name=metadata.get("name"),
            type=metadata.get("type"),
            value=metadata.get("value"),
            infotext=metadata.get("info_text"),
            dmp_id=metadata.get("dmp_pk"),
            dmp_form_field_id=metadata.get("dmp_form_field_pk")
        )
