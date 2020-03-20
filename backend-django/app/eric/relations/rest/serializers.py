#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.utils.translation import ugettext_lazy as _
from rest_framework.serializers import RelatedField
from django_userforeignkey.request import get_current_user
from django.core.exceptions import ValidationError
from rest_framework.serializers import SerializerMethodField

from eric.core.rest.serializers import BaseModelWithCreatedBySerializer
from eric.relations.models import Relation


class RelationObjectRelatedField(RelatedField):
    """
    Related Field which converts a given value via its default serializer
    """

    def to_representation(self, value):

        # if the object is none, we dont have permission to view it
        if value is None:
            data = {
                'error': True,
                'detail': _("No permission to view this element")
            }
            return data

        # get default serializer class
        serializer_cls = value._meta.get_default_serializer()
        # serialize the object
        serializer = serializer_cls(value, context=self.context)

        return serializer.data


class RelationSerializerExtended(BaseModelWithCreatedBySerializer):
    """ Serializer for Relations """

    left_content_object = RelationObjectRelatedField(read_only=True, many=False)
    right_content_object = RelationObjectRelatedField(read_only=True, many=False)

    left_content_type_model = SerializerMethodField()

    right_content_type_model = SerializerMethodField()

    def get_left_content_type_model(self, instance):
        if hasattr(instance, 'left_content_type'):
            return "%(app_label)s.%(model)s" % {
                'app_label': instance.left_content_type.app_label,
                'model': instance.left_content_type.model
            }

        return None

    def get_right_content_type_model(self, instance):
        if hasattr(instance, 'right_content_type'):
            return "%(app_label)s.%(model)s" % {
                'app_label': instance.right_content_type.app_label,
                'model': instance.right_content_type.model
            }

        return None

    class Meta:
        model = Relation
        fields = ('left_content_type', 'left_object_id',
                  'left_content_object',
                  'right_content_type', 'right_object_id',
                  'right_content_object',
                  'created_by', 'private',
                  'left_content_type_model',
                  'right_content_type_model'
                  )
        read_only_fields = ('left_content_object', 'right_content_object')

    def update(self, instance, validated_data):
        """ updates the private field only when the current user is the creator """
        user = get_current_user()
        if instance.created_by.pk == user.pk and not user.is_anonymous:
            instance.private = validated_data['private']
            instance.save()
        else:
            raise ValidationError({
                'private': ValidationError(
                    _('You are not allowed to change it.'),
                    params={'relation': self},
                    code='invalid'
                )
            })
        return instance
