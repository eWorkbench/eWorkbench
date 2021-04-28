#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rest_framework_nested.serializers import NestedHyperlinkedIdentityField

from eric.core.rest.serializers import BaseModelSerializer, BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.dmp.models import Dmp, DmpForm, DmpFormData, DmpFormField
from eric.metadata.rest.serializers import EntityMetadataSerializerMixin, EntityMetadataSerializer
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField


class DmpFormSerializerExtended(BaseModelSerializer):
    """ Serializer for DMP Forms """

    class Meta:
        model = DmpForm
        fields = ('title', 'description',)


class DmpFormFieldSerializerExtended(BaseModelSerializer):
    """ Serializer for DMP Form Fields """

    class Meta:
        model = DmpFormField
        fields = ('name', 'type', 'infotext', 'dmp_form')


class DmpFormDataSerializerExtended(BaseModelSerializer):
    """ Serializer for DMP Form Data """
    url = NestedHyperlinkedIdentityField(
        view_name='dmpformdata-detail',
        parent_lookup_kwargs={'dmp_pk': 'dmp__pk'},
        lookup_url_kwarg='pk',
        lookup_field='pk'
    )

    class Meta:
        model = DmpFormData
        fields = ('url', 'value', 'name', 'type', 'infotext', 'dmp', 'dmp_form_field', 'ordering')
        read_only_fields = ('name', 'type', 'infotext', 'dmp', 'dmp_form_field', 'ordering')


class DmpSerializerExtended(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """ Serializer for DMPs """
    dmp_form_title = serializers.SerializerMethodField(read_only=True)

    dmp_form_data = DmpFormDataSerializerExtended(many=True, required=False, read_only=True)

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    class Meta:
        model = Dmp
        fields = (
            'url', 'title', 'status', 'dmp_form', 'dmp_form_title', 'dmp_form_data', 'projects',
            'created_by', 'created_at', 'last_modified_by', 'last_modified_at', 'version_number',
            'metadata', 'is_favourite'
        )

    def get_dmp_form_title(self, dmp):
        try:
            return dmp.dmp_form.title
        except Dmp.dmp_form.RelatedObjectDoesNotExist:
            return None

    @transaction.atomic
    def create(self, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        instance = super().create(validated_data)
        self.create_metadata(metadata_list, instance)
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        metadata_list = self.pop_metadata(validated_data)
        self.update_metadata(metadata_list, instance)

        # list of changed dmp_form_data values
        initial_dmp_form_data = self.initial_data.get('dmp_form_data', [])

        # validated_data.pop('dmp_form_data')

        # iterate through list of changed dmp_form_data values
        for dmp_form_data in initial_dmp_form_data:
            # get pk and value from changed dmp_form_data
            data_pk = dmp_form_data.get('pk', None)
            data_value = dmp_form_data.get('value', None)

            # check if pk and value are set
            if data_pk and data_value is not None:
                # get the DB entry for dmp form data
                dmp_form_data_queryset = DmpFormData.objects.filter(dmp=instance, pk=data_pk)
                # check if an object with the pk exists
                if len(dmp_form_data_queryset) == 1:
                    form_data_db_instance = dmp_form_data_queryset.first()
                    # update form data value
                    form_data_db_instance.value = data_value
                    try:
                        form_data_db_instance.save()
                    except ValidationError as err:
                        if 'value' in err.message_dict:
                            raise ValidationError(
                                {
                                    data_pk: err.message_dict['value']
                                }
                            )
                        else:
                            raise err
                else:
                    raise NotFound
            else:
                raise ValidationError({
                    'dmp_form_data': ValidationError(
                        _('Not all fields are provided'),
                        params={'assignment': self},
                        code='invalid'
                    )
                })

        # last but not least, update DMP title and status
        # instance.title = validated_data.get('title', instance.title)
        # instance.status = validated_data.get('status', instance.status)
        # instance.project = validated_data.get('project', instance.project)
        # instance.dmp_form = validated_data.get('dmp_form', instance.dmp_form)
        # instance.save()

        return super(DmpSerializerExtended, self).update(instance, validated_data)
