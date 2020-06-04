#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from rest_framework_nested.serializers import NestedHyperlinkedIdentityField

from eric.core.rest.serializers import BaseModelSerializer, PublicUserSerializer

from eric.model_privileges.models import ModelPrivilege
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class ModelPrivilegeSerializer(BaseModelSerializer):
    """ Serializer for Notes """
    # add the user serializer with read only
    user = PublicUserSerializer(read_only=True)

    # add the users primary key (yes, we add user and user_pk on purpose; one time with read_only)
    user_pk = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        many=False,
        required=True
    )

    content_type_pk = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.all(),
        source='content_type',
        many=False,
        required=True
    )

    class Meta:
        model = ModelPrivilege
        fields = (
            'user', 'user_pk',
            'full_access_privilege',
            'view_privilege', 'edit_privilege', 'delete_privilege', 'restore_privilege', 'trash_privilege',
            'content_type', 'content_type_pk', 'object_id'
        )
        # There is a bug in DRF 3.11, which will be fixed in an upcoming version:
        # https://github.com/encode/django-rest-framework/issues/7100 and
        # https://github.com/encode/django-rest-framework/pull/7143
        # Meanwhile the following workaround will work.
        # The field names are the ones used in the serializer not the ones used in the model.
        validators = [
            UniqueTogetherValidator(queryset=ModelPrivilege.objects.all(), fields=[
                'user_pk',
                'content_type_pk',
                'object_id'
            ]),
        ]
