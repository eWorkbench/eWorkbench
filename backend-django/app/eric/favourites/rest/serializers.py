#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.serializers import RelatedField
from django_userforeignkey.request import get_current_user
from rest_framework.serializers import SerializerMethodField

from eric.core.rest.serializers import BaseModelWithCreatedBySerializer
from eric.favourites.models.models import Favourite


class FavouriteObjectRelatedField(RelatedField):
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


class FavouriteSerializer(BaseModelWithCreatedBySerializer):
    """ Serializer for Favourites """

    content_object = FavouriteObjectRelatedField(read_only=True, many=False)

    content_type_pk = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.all(),
        source='content_type',
        many=False,
        required=True
    )

    user_id = serializers.PrimaryKeyRelatedField(
        # write is handled in FavouritesViewSet
        read_only=True,
    )

    content_type_model = SerializerMethodField()

    def get_content_type_model(self, instance):
        if hasattr(instance, 'content_type'):
            return "%(app_label)s.%(model)s" % {
                'app_label': instance.content_type.app_label,
                'model': instance.content_type.model
            }

        return None

    class Meta:
        model = Favourite
        fields = ('object_id',
                  'content_type',
                  'content_type_pk',
                  'user_id',
                  'content_type_model',
                  'content_object'
                  )
        read_only_fields = ('content_object', 'user_id')

    @transaction.atomic
    def create(self, validated_data):
        user = get_current_user()
        validated_data['user_id'] = user.id

        instance = super().create(validated_data)

        return instance
