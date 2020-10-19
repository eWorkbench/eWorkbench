#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from typing import Iterable

from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError
from rest_framework.fields import SerializerMethodField
from rest_framework.serializers import UUIDField

from eric.core.models.abstract import OrderingModelMixin
from eric.core.rest.serializers import BaseModelWithCreatedBySerializer, BaseModelSerializer
from eric.metadata.models.models import Metadata, MetadataField


class MetadataFieldSerializer(BaseModelSerializer):
    """ REST API serializer for metadata fields """

    @staticmethod
    def _check_decimals(decimals):
        if decimals is None:
            raise ValidationError({'decimals': _('This field may not be blank.')})
        else:
            if decimals < 0:
                raise ValidationError({'decimals': _('This value may not be negative.')})

    def validate(self, data):
        """
        Validate the metadata settings
        """
        base_type = data.get('base_type', None)
        type_settings = data.get('type_settings', None)

        if not base_type:
            raise ValidationError(_("No metadata field data found."))

        # Selection
        if base_type == MetadataField.BASE_TYPE_SELECTION:
            answers = type_settings.get('answers', None)
            if not answers:
                raise ValidationError({"answers": _('Please add an answer.')})
            else:
                # Don't allow empty fields
                for index, answer in enumerate(answers):
                    if not answer or len(answer.strip()) <= 0:
                        raise ValidationError({index: _('This field may not be blank.')})
                # Don't allow duplicates
                if not len(answers) == len(set(answers)):
                    indexes = [i for i in range(len(answers)) if not i == answers.index(answers[i])]
                    raise ValidationError({indexes[0]: _('Answers must be unique.')})

        # Decimal Number
        elif base_type == MetadataField.BASE_TYPE_DECIMAL_NUMBER:
            decimals = type_settings.get('decimals', None)
            self._check_decimals(decimals)
            if decimals < 1:
                raise ValidationError({'decimals': _('At least one decimal place is required.')})

        # Currency
        elif base_type == MetadataField.BASE_TYPE_CURRENCY:
            decimals = type_settings.get('decimals', None)
            symbol = type_settings.get('symbol', '')
            self._check_decimals(decimals)
            if len(symbol.strip()) <= 0:
                raise ValidationError({'symbol': _('This field may not be blank.')})

        # Percentage
        elif base_type == MetadataField.BASE_TYPE_PERCENTAGE:
            decimals = type_settings.get('decimals', None)
            self._check_decimals(decimals)

        return data

    class Meta:
        model = MetadataField
        fields = ('name', 'description', 'base_type', 'type_settings',)


class MetadataSerializer(BaseModelSerializer):
    """ REST API serializer for metadata values """

    # readonly field for nested metadata-field-type info
    field_info = SerializerMethodField()

    def get_field_info(self, obj):
        return MetadataFieldSerializer().to_representation(obj.field)

    class Meta:
        model = Metadata
        fields = (
            'field',
            'values',
            'field_info',
            'entity_id',
            'entity_content_type',
            'ordering',
        )


class EntityMetadataSerializer(BaseModelSerializer):
    """ Serializer for metadata inside an entity """

    pk = UUIDField(read_only=False, required=False)

    # readonly field for nested metadata-field-type info
    field_info = SerializerMethodField()

    def get_field_info(self, obj):
        return MetadataFieldSerializer().to_representation(obj.field)

    class Meta:
        model = Metadata
        fields = ('field', 'field_info', 'values', 'pk', 'ordering',)


class EntityMetadataSerializerMixin:
    @staticmethod
    def pop_metadata(validated_data):
        return validated_data.pop('metadata') if 'metadata' in validated_data else None

    @staticmethod
    def create_metadata(metadata_list: Iterable[dict], instance):
        if metadata_list is not None:
            for metadata in metadata_list:
                Metadata.objects.create(
                    entity=instance,
                    field=metadata['field'],
                    values=metadata['values'],
                    ordering=metadata.get('ordering', OrderingModelMixin.DEFAULT_ORDERING),
                )

    @classmethod
    def update_metadata(cls, metadata_list: Iterable[dict], instance):
        if metadata_list is None:
            return

        current_metadata_pks = set(instance.metadata.values_list('pk', flat=True))
        sent_metadata_pks = {metadata['pk'] for metadata in metadata_list if 'pk' in metadata}
        removed_metadata_pks = current_metadata_pks.difference(sent_metadata_pks)

        # delete removed metadata
        Metadata.objects.filter(pk__in=removed_metadata_pks).delete()

        # create new metadata and update existing metadata
        for metadata_input in metadata_list:
            pk = metadata_input.get('pk', None)
            field = metadata_input.get('field')
            values = metadata_input.get('values')
            ordering = metadata_input.get('ordering', OrderingModelMixin.DEFAULT_ORDERING)
            is_valid = cls.has_valid_field(field)

            if pk and pk in current_metadata_pks:
                # exists already -> update
                metadata_model = Metadata.objects.filter(pk=pk).first()
                if is_valid:
                    metadata_model.field = field
                    metadata_model.values = values
                    metadata_model.ordering = ordering
                    metadata_model.save()
                else:
                    metadata_model.delete()
            else:
                # new -> create
                if is_valid:
                    Metadata.objects.create(
                        entity=instance,
                        field=field,
                        values=values,
                        ordering=ordering,
                    )

    @staticmethod
    def has_valid_field(field):
        return field is not None and len(str(field)) > 0
