#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import urllib

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError

from rest_framework import serializers
from rest_framework import fields, serializers, relations

from eric.userprofile.models import UserProfile
from eric.userprofile.rest.serializers import PublicUserProfileSerializer

User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    """ A very minimalistic user serializer, only displaying name and email """
    userprofile = PublicUserProfileSerializer()

    class Meta:
        model = User
        fields = ('pk', 'username', 'email', 'is_active', 'is_staff', 'last_login', 'userprofile')
        read_only_fields = ('username', 'is_active', 'is_staff', 'last_login', 'userprofile')


class PublicUserGroupSerializer(serializers.ModelSerializer):
    """ A very minimalistic usergroup serializer, only displaying name """
    class Meta:
        model = Group
        fields = ('pk', 'name')
        read_only_fields = ('name',)


class HyperlinkedToListField(relations.HyperlinkedIdentityField):
    """
    Provides a hyperlink to a LIST endpoint of another API
    """
    lookup_field_name = ""

    def __init__(self, *args, **kwargs):
        self.lookup_field_name = kwargs.pop('lookup_field_name', None)

        super(HyperlinkedToListField, self).__init__(*args, **kwargs)

    def to_representation(self, obj):
        request = self.context.get('request')

        from rest_framework.reverse import reverse

        return reverse(
            self.view_name,
            kwargs={self.lookup_field_name: obj.pk},
            request=request
        )


class HyperlinkedQueryToListField(relations.HyperlinkedIdentityField):
    """
    Provides a hyperlink to a LIST endpoint (with query parameters) of another REST API endpoint
    """
    lookup_field_name = ""

    def __init__(self, *args, **kwargs):
        self.lookup_field_name = kwargs.pop('lookup_field_name', None)

        super(HyperlinkedQueryToListField, self).__init__(*args, **kwargs)

    def to_representation(self, obj):
        request = self.context.get('request')

        from rest_framework.reverse import reverse

        return '{}?{}'.format(
            reverse(
                self.view_name,
                request=request
            ),
            urllib.parse.urlencode(
                {self.lookup_field_name: obj.pk}
            )
        )


class BaseSerializer(serializers.Serializer):
    """Serializer BaseModelSerializer

    A type of `Serializer` that is used within the application.
    """

    def create(self, validated_data):
        pass


class BaseModelSerializer(serializers.ModelSerializer):
    display = fields.CharField(
        source='__str__',
        read_only=True,
    )

    content_type = serializers.SerializerMethodField()

    content_type_model = serializers.SerializerMethodField()

    def get_content_type_model(self, obj):
        ct = obj.get_content_type()
        if ct:
            return "%(app_label)s.%(model)s" % {
                'app_label': ct.app_label,
                'model': ct.model
            }
        return None

    def get_content_type(self, obj):
        ct = obj.get_content_type()
        if ct:
            return ct.pk
        return None

    def get_field_names(self, declared_fields, info):
        """
        Overrides the default get_field_names method, and adds the primary key, the display (__str__) and
        content_type"""
        field_names = super(BaseModelSerializer, self).get_field_names(declared_fields, info)
        # add pk, display and content_type to this, as a set (enforcing uniqueness of those fields)
        return tuple(set(('pk', 'display', 'content_type', 'content_type_model') + field_names))

    def get_default_field_names(self, declared_fields, model_info):
        """
        Return the default list of field names that will be used if the
        `Meta.fields` option is not specified.
        """
        return (
            ['pk', 'display', 'content_type', 'content_type_model'] +
            list(declared_fields.keys()) +
            list(model_info.fields.keys()) +
            list(model_info.forward_relations.keys())
        )

    def build_relational_field(self, field_name, relation_info):
        """
        Create fields for forward and reverse relationships.
        """
        field_class, field_kwargs = super(BaseModelSerializer, self).build_relational_field(field_name, relation_info)
        model_field, related_model, to_many, to_field, has_through_model, *extras = relation_info

        if not model_field and related_model:
            field_kwargs['required'] = False
            field_kwargs['allow_null'] = True

        return field_class, field_kwargs


class BaseModelWithCreatedBySerializer(BaseModelSerializer):
    created_by = PublicUserSerializer(
        read_only=True
    )

    created_at = serializers.DateTimeField(
        read_only=True
    )

    last_modified_by = PublicUserSerializer(
        read_only=True
    )

    last_modified_at = serializers.DateTimeField(
        read_only=True
    )

    def get_field_names(self, declared_fields, info):
        """ Overrides the default get_field_names method, and adds the primary key, the display (__str__) and
        content_type"""
        field_names = super(BaseModelWithCreatedBySerializer, self).get_field_names(declared_fields, info)
        # add pk, display and content_type to this, as a set (enforcing uniqueness of those fields)
        return tuple(set(('created_by', 'created_at', 'last_modified_by', 'last_modified_at') + field_names))


class BaseModelWithCreatedByAndSoftDeleteSerializer(BaseModelWithCreatedBySerializer):
    deleted = fields.BooleanField(read_only=True)

    def get_field_names(self, declared_fields, info):
        """ Overrides the default get_field_names method, and adds the deleted flag """
        field_names = super(BaseModelWithCreatedByAndSoftDeleteSerializer, self).get_field_names(declared_fields, info)
        # add pk, display and content_type to this, as a set (enforcing uniqueness of those fields)
        return tuple(set(('deleted',) + field_names))
