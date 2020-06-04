#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import JSONField
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_changeset.models import CreatedModifiedByMixIn

from eric.core.models import BaseModel
from eric.metadata.models.managers import MetadataManager


class MetadataField(BaseModel, CreatedModifiedByMixIn):
    """ Represents a metadata field """

    class Meta:
        ordering = ['name', ]

    BASE_TYPE_WHOLE_NUMBER = 'whole_number'
    BASE_TYPE_DECIMAL_NUMBER = 'decimal_number'
    BASE_TYPE_CURRENCY = 'currency'
    BASE_TYPE_DATE = 'date'
    BASE_TYPE_TIME = 'time'
    BASE_TYPE_PERCENTAGE = 'percentage'
    BASE_TYPE_TEXT = 'text'
    BASE_TYPE_FRACTION = 'fraction'
    BASE_TYPE_GPS = 'gps'
    BASE_TYPE_CHECKBOX = 'checkbox'
    BASE_TYPE_SELECTION = 'selection'

    BASE_TYPE_CHOICES = (
        (BASE_TYPE_WHOLE_NUMBER, _('Integer')),
        (BASE_TYPE_DECIMAL_NUMBER, _('Decimal number')),
        (BASE_TYPE_CURRENCY, _('Currency')),
        (BASE_TYPE_DATE, _('Date')),
        (BASE_TYPE_TIME, _('Time')),
        (BASE_TYPE_PERCENTAGE, _('Percentage')),
        (BASE_TYPE_TEXT, _('Text')),
        (BASE_TYPE_FRACTION, _('Fraction')),
        (BASE_TYPE_GPS, _('GPS')),
        (BASE_TYPE_CHECKBOX, _('Checkbox')),
        (BASE_TYPE_SELECTION, _('Selection')),
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    name = models.CharField(
        max_length=128,
        verbose_name=_("Field type name"),
        blank=False,
        null=False,
        unique=True,
    )

    description = models.TextField(
        verbose_name=_("Field type description"),
        blank=False,
        null=False,
    )

    base_type = models.CharField(
        max_length=32,
        verbose_name=_("Metadata base type"),
        choices=BASE_TYPE_CHOICES,
        blank=False,
        null=False,
    )

    type_settings = JSONField(
        verbose_name=_("Values for base type settings"),
        default=dict,
        null=False,
        blank=True,
    )

    def __str__(self):
        return self.name

    @staticmethod
    def get_display_name_for_base_type(api_name):
        return [
            display_name for (internal_name, display_name) in MetadataField.BASE_TYPE_CHOICES
            if internal_name == api_name
        ][0]

    def get_default_value(self):
        base_type = self.base_type

        if base_type in [
            self.BASE_TYPE_WHOLE_NUMBER,
            self.BASE_TYPE_DECIMAL_NUMBER,
            self.BASE_TYPE_CURRENCY,
            self.BASE_TYPE_DATE,
            self.BASE_TYPE_TIME,
            self.BASE_TYPE_PERCENTAGE,
        ]:
            return {'value': None}

        elif base_type == self.BASE_TYPE_TEXT:
            return {'value': ''}

        elif base_type == self.BASE_TYPE_FRACTION:
            return {'numerator': None, 'denominator': None}

        elif base_type == self.BASE_TYPE_GPS:
            return {'x': '', 'y': ''}

        elif base_type == self.BASE_TYPE_CHECKBOX:
            return {'value': False}

        elif base_type == self.BASE_TYPE_SELECTION:
            return {
                'answers': {}
            }


class Metadata(BaseModel, CreatedModifiedByMixIn):
    """ A concrete metadata value with a specified type, associated to a specific workbench entity """
    objects = MetadataManager()

    class Meta:
        ordering = ['created_at', ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    # generic foreign key to workbench entity
    entity_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        blank=True,
    )
    entity_id = models.UUIDField(blank=True)
    entity = GenericForeignKey('entity_content_type', 'entity_id')

    field = models.ForeignKey(
        MetadataField,
        verbose_name=_("Field type"),
        related_name='values',
        on_delete=models.CASCADE,
        blank=False,
        null=False,
    )

    values = JSONField(
        verbose_name=_("Field values"),
        null=False,
    )

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        if not self.values:
            self.values = self.field.get_default_value()

        return super().save(force_insert, force_update, using, update_fields)

    def __str__(self):
        return str(self.pk)

    def export(self):
        """ Exports the metadata """
        return {
            "field": self.field.pk,
            "values": self.values,
        }

    @staticmethod
    def export_all_from_entity(entity):
        """ Exports all the metadata values from the given entity """
        return [
            metadata.export() for metadata in Metadata.objects.filter(entity_id=entity.pk)
        ]

    @staticmethod
    def restore_all_from_entity(entity, metadata_list):
        """ Restores all the metadata values for the given entity """
        Metadata.objects.filter(entity_id=entity.pk).delete()
        if metadata_list:
            for metadata in metadata_list:
                field_pk = metadata.get("field")
                if MetadataField.objects.filter(pk=field_pk).exists():
                    Metadata.objects.create(
                        field_id=field_pk,
                        values=metadata.get("values"),
                        entity=entity,
                    )
